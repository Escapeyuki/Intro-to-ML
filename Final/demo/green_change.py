# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["numpy", "rasterio", "matplotlib", "requests"]
# ///
"""
Green Diff demo: how did green space change in one part of NYC?

Run with:  uv run green_change.py

1. Download summer Sentinel-2 images for each year (free, no account).
2. Compute NDVI (how green each pixel is) and take the median per year.
3. Count the green area per year (the trend).
4. Compare two years and find what was gained or lost.
5. Cut the map into tiles and measure how concentrated the change is
   (this is what the "only look at what changed" optimization depends on).

Data: Sentinel-2 L2A cloud-optimized GeoTIFFs from the Element 84
Earth Search STAC API, https://earth-search.aws.element84.com/v1
"""

import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import rasterio
import requests
from rasterio.enums import Resampling
from rasterio.warp import transform, transform_bounds
from rasterio.windows import from_bounds

os.environ["GDAL_DISABLE_READDIR_ON_OPEN"] = "EMPTY_DIR"

# Manhattan up to the top of Central Park, the Brooklyn and Queens waterfront,
# Governors Island. It also catches a strip of New Jersey (not clipped out yet).
BBOX = (-74.05, 40.68, -73.90, 40.80)  # west, south, east, north
YEARS = range(2018, 2027)
SCENES_PER_YEAR = 4
MGRS_TILE = "MGRS-18TWL"  # one satellite grid square, so every image lines up
GREEN = 0.4  # NDVI above this counts as green
REAL_CHANGE = 0.2  # NDVI must move this much for a pixel to count as changed
TILE = 32  # tile size in pixels (32 x 10 m = 320 m)

STAC = "https://earth-search.aws.element84.com/v1/search"
HERE = Path(__file__).parent
CACHE = HERE / "cache"
OUT = HERE / "output"
CACHE.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)


def find_scenes(year):
    """The least cloudy summer scenes for one year, one per date."""
    body = {
        "collections": ["sentinel-2-l2a"],
        "bbox": list(BBOX),
        "datetime": f"{year}-06-15T00:00:00Z/{year}-09-05T23:59:59Z",
        "query": {"eo:cloud_cover": {"lt": 20}, "grid:code": {"eq": MGRS_TILE}},
        "limit": 100,
    }
    items = requests.post(STAC, json=body, timeout=60).json()["features"]
    # The same date can appear twice (old and reprocessed). Keep the
    # reprocessed one, whose brightness offset is already corrected.
    by_date = {}
    for item in items:
        p = item["properties"]
        date = p["datetime"][:10]
        fixed = bool(p.get("earthsearch:boa_offset_applied"))
        if date not in by_date or fixed:
            by_date[date] = item
    scenes = sorted(by_date.values(), key=lambda i: i["properties"]["eo:cloud_cover"])
    return scenes[:SCENES_PER_YEAR]


def read_band(item, name, shape=None):
    """Read just our area from one band. Returns (array, transform)."""
    with rasterio.open(item["assets"][name]["href"]) as src:
        bounds = transform_bounds("EPSG:4326", src.crs, *BBOX)
        window = from_bounds(*bounds, transform=src.transform).round_offsets().round_lengths()
        if shape is None:
            data = src.read(1, window=window)
        else:
            data = src.read(1, window=window, out_shape=shape, resampling=Resampling.nearest)
        return data.astype("float32"), src.window_transform(window), src.crs


def scene_ndvi(item):
    """NDVI for one scene, with clouds and shadows set to NaN."""
    red, tf, crs = read_band(item, "red")
    nir, _, _ = read_band(item, "nir")
    scl, _, _ = read_band(item, "scl", shape=red.shape)  # 20 m, stretched to 10 m

    # Scenes processed after Jan 2022 have 1000 added to every value.
    # Earth Search removes it for most scenes and says so in the metadata.
    p = item["properties"]
    if float(p.get("s2:processing_baseline", 0)) >= 4 and not p.get("earthsearch:boa_offset_applied"):
        red -= 1000
        nir -= 1000

    ndvi = (nir - red) / np.maximum(nir + red, 1)
    # Scene classification: 0 no data, 1 broken, 3 cloud shadow, 8-10 cloud
    bad = np.isin(scl, [0, 1, 3, 8, 9, 10]) | (red <= 0) | (nir <= 0)
    ndvi[bad] = np.nan
    return ndvi, tf, crs


def year_ndvi(year):
    """Median NDVI of the best summer scenes. Saved so reruns are instant."""
    path = CACHE / f"ndvi_{year}.npz"
    if path.exists():
        d = np.load(path, allow_pickle=True)
        return d["ndvi"], d["tf"], str(d["crs"]), list(d["dates"])
    scenes = find_scenes(year)
    stack, dates = [], []
    for item in scenes:
        ndvi, tf, crs = scene_ndvi(item)
        stack.append(ndvi)
        dates.append(item["properties"]["datetime"][:10])
        print(f"  {year}: read {dates[-1]} ({np.isnan(ndvi).mean():.0%} masked)")
    ndvi = np.nanmedian(np.stack(stack), axis=0)
    np.savez_compressed(path, ndvi=ndvi, tf=np.array(tf), crs=str(crs), dates=dates)
    return ndvi, np.array(tf), str(crs), dates


def changes(a, b):
    """Pixels that went from not-green to green (gained) or the reverse (lost)."""
    big = np.abs(b - a) > REAL_CHANGE
    gained = (a <= GREEN) & (b > GREEN) & big
    lost = (a > GREEN) & (b <= GREEN) & big
    return gained, lost


def per_tile(mask):
    """Count the True pixels in each TILE x TILE square."""
    h, w = (mask.shape[0] // TILE) * TILE, (mask.shape[1] // TILE) * TILE
    return mask[:h, :w].reshape(h // TILE, TILE, w // TILE, TILE).sum(axis=(1, 3))


def concentration(changed):
    """Sort tiles from most to least changed.
    Returns the share of all changed pixels found after checking each tile."""
    counts = np.sort(per_tile(changed).ravel())[::-1]
    found = np.cumsum(counts) / max(counts.sum(), 1)
    return counts, found


def tiles_needed(found, share):
    """What fraction of tiles holds `share` of the changed pixels?"""
    return (np.searchsorted(found, share) + 1) / len(found)


def main():
    ndvi, dates = {}, {}
    for year in YEARS:
        ndvi[year], tf, crs, dates[year] = year_ndvi(year)
    years = list(YEARS)
    first, last = years[0], years[-1]
    pixel_km2 = (10 * 10) / 1e6

    # ---- 1. The trend ----
    print("\nGreen area per year (NDVI > %.1f)" % GREEN)
    area = {}
    for y in years:
        area[y] = (ndvi[y] > GREEN).sum() * pixel_km2
        print(f"  {y}: {area[y]:6.2f} km2   mean NDVI {np.nanmean(ndvi[y]):.3f}   scenes {', '.join(dates[y])}")

    fig, ax = plt.subplots(figsize=(7, 3.5))
    ax.plot(years, [area[y] for y in years], marker="o", color="#2e7d32")
    ax.set_ylabel("green area (km²)")
    ax.set_title("Green area in the study area, summer of each year")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "1_trend.png", dpi=150)

    # ---- 2. What changed between the first and last year ----
    gained, lost = changes(ndvi[first], ndvi[last])
    print(f"\n{first} -> {last}: gained {gained.sum() * pixel_km2:.2f} km2, lost {lost.sum() * pixel_km2:.2f} km2")

    fig, axes = plt.subplots(1, 3, figsize=(15, 6.5))
    for ax, y in zip(axes[:2], (first, last)):
        ax.imshow(ndvi[y], cmap="YlGn", vmin=0, vmax=0.9)
        ax.set_title(f"How green, summer {y}")
    rgb = np.repeat(np.clip(ndvi[last], 0, 1)[..., None] * 0.5 + 0.2, 3, axis=2)
    rgb[gained] = (0.1, 0.9, 0.2)
    rgb[lost] = (1.0, 0.1, 0.8)
    axes[2].imshow(rgb)
    axes[2].set_title(f"Change {first} to {last}: green = gained, pink = lost")
    for ax in axes:
        ax.axis("off")
    fig.tight_layout()
    fig.savefig(OUT / "2_change_map.png", dpi=150)

    # ---- 3. How concentrated is the change? (the optimization question) ----
    print(f"\nHow concentrated is the change? Tiles are {TILE}x{TILE} px ({TILE * 10} m).")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))
    one_year = []
    for a, b in zip(years[:-1], years[1:]):
        g, l = changes(ndvi[a], ndvi[b])
        counts, found = concentration(g | l)
        untouched = (counts == 0).mean()
        need90 = tiles_needed(found, 0.9)
        one_year.append((untouched, need90, (g | l).mean()))
        ax2.plot(np.arange(1, len(found) + 1) / len(found) * 100, found * 100, color="#90a4ae", lw=1)
        print(f"  {a}->{b}: {(g | l).mean():.2%} of pixels changed, "
              f"{untouched:.0%} of tiles have zero change, "
              f"90% of the change is in {need90:.0%} of tiles")
    counts, found = concentration(gained | lost)
    print(f"  {first}->{last}: {(gained | lost).mean():.2%} of pixels changed, "
          f"{(counts == 0).mean():.0%} of tiles have zero change, "
          f"90% of the change is in {tiles_needed(found, 0.9):.0%} of tiles")
    u, n, c = np.mean(one_year, axis=0)
    print(f"  average one-year pair: {c:.2%} of pixels changed, {u:.0%} of tiles untouched, "
          f"90% of the change in {n:.0%} of tiles")

    grid = per_tile(gained | lost) / TILE**2 * 100
    im = ax1.imshow(grid, cmap="magma")
    ax1.set_title(f"% of each tile that changed, {first} to {last}")
    ax1.axis("off")
    fig.colorbar(im, ax=ax1, shrink=0.7)
    ax2.plot(np.arange(1, len(found) + 1) / len(found) * 100, found * 100, color="#d81b60", lw=2.5,
             label=f"{first} to {last}")
    ax2.plot([], [], color="#90a4ae", label="each one-year pair")
    ax2.plot([0, 100], [0, 100], "k:", lw=1, label="if change were spread evenly")
    ax2.set_xlabel("% of tiles analyzed (most changed first)")
    ax2.set_ylabel("% of all changed pixels found")
    ax2.set_title("Most of the change is in a few tiles")
    ax2.legend()
    ax2.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "3_concentration.png", dpi=150)

    # ---- 4. Where are the most changed tiles? (to look them up on a map) ----
    print(f"\nMost changed tiles, {first} -> {last} (paste into a map to see the place):")
    g_t, l_t = per_tile(gained), per_tile(lost)
    a, _, cx, _, e, fy = tf[0], tf[1], tf[2], tf[3], tf[4], tf[5]
    order = np.argsort((g_t + l_t).ravel())[::-1][:12]
    for idx in order:
        r, c = divmod(idx, g_t.shape[1])
        x = cx + (c + 0.5) * TILE * a
        y = fy + (r + 0.5) * TILE * e
        lon, lat = transform(crs, "EPSG:4326", [x], [y])
        print(f"  {lat[0]:.4f}, {lon[0]:.4f}   gained {g_t[r, c] / 100:.1f} ha   lost {l_t[r, c] / 100:.1f} ha")

    print(f"\nFigures saved in {OUT}")


if __name__ == "__main__":
    main()
