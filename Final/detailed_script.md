# Green Diff: The Detailed Explanation

<!-- DRAFT: rewrite in your own words. -->

This is the long version. It explains every step, why I did it, and what the demo found. Use it for the Q&A, the blog post, or to explain the project to someone who has never seen a satellite image.

## 1. The big idea

Imagine a security guard watching a wall of camera screens at night. The guard doesn't stare at every screen equally. Most hallways are empty and stay empty. The guard only leans in when something moves.

My project treats New York City like that wall of screens. Each screen is a small square of the city, called a tile. Once a year, I check which tiles changed. Only those tiles get a closer look from a slow, careful model. I call the slow model the detective.

So there are two jobs:

1. **Find out what happened to the city's green space.**
2. **Find out how much time the guard saves the detective.**

## 2. Where the pictures come from

The pictures come from Sentinel-2, a pair of satellites run by the European Space Agency. They photograph the same spot every few days. The pictures are free and I don't need an account to download them.

Each pixel covers a square of ground 10 meters on each side. That's about the size of a small house. A park is many pixels. A single street tree is less than one pixel, so I can't see it.

My demo looks at a box about 13 km wide. It covers Manhattan from the southern tip up to the top of Central Park, plus the waterfronts of Brooklyn and Queens. It also includes a strip of New Jersey across the Hudson, which I still need to cut out.

## 3. How a satellite sees plants

A normal camera records red, green, and blue light. Sentinel-2 also records **near-infrared** light, which our eyes can't see.

Plants treat these kinds of light very differently. A leaf soaks up red light, because it uses that light to make food. But it bounces near-infrared light away. So in a near-infrared picture, a healthy lawn is bright, and a parking lot is dull.

**NDVI** is a formula that uses this:

```
NDVI = (near-infrared − red) / (near-infrared + red)
```

- If something reflects much more near-infrared than red, NDVI is close to 1. That's healthy plants.
- If the two are about the same, NDVI is close to 0. That's concrete, roofs, and bare ground.
- Water is usually below 0.

In my demo, the Great Lawn in Central Park scores between 0.75 and 0.80 every single summer. I count a pixel as green if its NDVI is above 0.4. I picked 0.4 by hand, and a different cutoff would give different totals.

NDVI is not machine learning. It's a formula from the 1970s. That makes it a good baseline: any model I train has to beat it to be worth the trouble.

## 4. Getting one clean picture per year

One picture is not enough. There might be a cloud over Brooklyn, or a cloud's shadow over the park.

Think of taking a group photo. In every shot, somebody blinks. So you take four shots and, for each face, pick the one that looks normal.

I do the same thing. For each summer I take the four least cloudy images. The satellite's own cloud map tells me which pixels to throw away. Then, for each pixel, I take the **median** of what's left, which is the middle value. One odd image can't pull the result away.

I only use summer images, from mid June to early September. In winter the trees have no leaves, and the whole city would look like it lost its green.

That's 36 images in total: 9 summers, 4 images each.

## 5. What the demo found about the city

### The trend is flat, and the wobble is big

| Summer | Green area in the box |
| --- | --- |
| 2018 | 30.6 km² |
| 2019 | 27.8 km² |
| 2020 | 29.4 km² |
| 2021 | 31.2 km² |
| 2022 | 29.8 km² |
| 2023 | 29.7 km² |
| 2024 | 30.7 km² |
| 2025 | 28.5 km² |
| 2026 | 30.3 km² |

There's no clear line going up or down. The number moves by 1 to 3 km² from one year to the next, and then moves back. A park doesn't vanish and return in a year, so most of that wobble is probably not real change. It could be weather, like grass going brown in a dry August, or just which days the clear images happened to fall on. I haven't checked which yet.

That's the first honest lesson: **the total is noisy. The interesting part is where the change is, not the total.**

### The map points at real places

Comparing 2018 to 2026, the demo found about 1.1 km² of green gained and 2.2 km² lost. I only count a pixel if its NDVI moved by more than 0.2. That keeps out pixels that sit right on the cutoff and flip back and forth.

The clearest loss inside NYC is a long strip on the Lower East Side waterfront. That's East River Park. Starting in late 2021, the city tore up large parts of the park and cut down many of its trees, to raise the land and protect the neighborhood from floods. In my data, that tile holds steady from 2018 to 2021 and then falls every year after.

I like this example because the satellite can only say "green went away here." It can't say why, or whether it was a good trade. Somebody has to look it up. That's a job for a human, or maybe for a language model looking at the before and after pictures.

The two biggest losses in the whole box are actually in New Jersey, where about 8 hectares of green disappeared between 2024 and 2025. I haven't looked up what happened there.

## 6. The optimization, step by step

### Why bother?

In Assignment 9, I made a text adventure where Gemini drew every room. A picture cost about 8 times more tokens than a text reply. So I saved one picture per room, and only asked for a new one when something in the room changed.

Video works the same way. When you watch a news anchor, the desk and the wall behind them don't change. The video file stores one full picture, and after that it mostly stores the moving mouth.

Here, the "expensive picture" is a slow model looking at a tile. NDVI is instant, so it doesn't need this trick. But a neural network takes real time on every tile, and Gemini has a limit on requests per day. For those, skipping matters.

### What I measured

I cut the map into tiles and counted the changed pixels in each one. Then I sorted the tiles from most changed to least changed and asked: if I only check the top tiles, how much of the change do I catch?

For an average pair of years, one year apart:

| Tile size | Tiles with zero change | Tiles needed to catch 90% of the change |
| --- | --- | --- |
| 640 m | 14% | 47% |
| 320 m | 42% | 30% |
| 160 m | 73% | 15% |
| 80 m | 90% | 7% |

Only about **0.5% of pixels** change in a year. So "most of the image is the same" is true.

But tile size changes everything. It's like looking for lost keys. If you search room by room, almost every room has *something* out of place, so you end up searching most of the house. If you search drawer by drawer, most drawers are fine and you can skip them.

With 80 m tiles, the detective would only visit 7% of the city and still catch 90% of the change.

### What the demo does not prove yet

I want to be clear about the limits.

- **There is no slow model yet.** The demo shows the change is concentrated. It doesn't show real time saved. That needs a real slow model, which is next.
- **The guard already knows the answer.** I sorted the tiles using the true amount of change. A real guard only gets a cheap guess. The real test is whether a cheap guess picks the same tiles.
- **Small tiles have a cost.** A neural network needs to see some surroundings to understand a place. An 80 m tile is only 8 by 8 pixels. That may be too small for the detective to work with.

## 7. What can fool it

- **Clouds and shadows.** A cloud looks like a giant change. The median of four images handles most of this.
- **A dry summer.** A lawn that goes brown in August looks like lost green. The fix is to wait a year. Real loss stays lost. Dry grass comes back.
- **Slow change.** You don't notice a child growing day to day. A grandparent who visits once a year notices right away. A young tree is the same. Each year it grows a little, never enough to trip the alarm, but over six years it becomes a real patch of green. So the guard should compare each tile to the last time the detective looked at it, not just to last year.
- **Edges.** A pixel that is half grass and half sidewalk can flip from year to year. That's why I require a real jump in NDVI before I count it.

## 8. The models I will compare

| Model | In plain words |
| --- | --- |
| NDVI | A formula. Fast, and it only says "green or not." |
| Random forest | Hundreds of small decision trees that vote on each pixel. |
| Small CNN | Like my Doodle Invaders network, but it labels every pixel instead of the whole picture. |
| Dynamic World | A land cover model Google already trained. It can tell trees from grass. |
| Gemini | I send before and after pictures and ask what changed, in words. |

To grade them, I'll use NYC's 2017 Land Cover map as the answer key. It was made from LiDAR and aerial photos and is much sharper than my images.

The full plan is in `research_plan.md`.

## 9. Questions people might ask

**Is this machine learning?**
The demo isn't. NDVI is a formula. The machine learning comes in when I compare it to trained models and when a cheap model decides which tiles to skip. If the formula beats the trained models, I'll report that.

**Is NYC getting greener?**
From this data I can't say. The year to year wobble is bigger than any trend. What I can say is where specific places gained or lost green.

**Why not use sharper images?**
Sharper free images exist (NAIP, about 0.6 m), but they are only taken every two or three years. One idea is to use the 10 m satellite as the guard and only open the sharp photo where the guard sees a change.

**Does the lazy way miss things?**
Yes. That's the trade. My goal is one sentence with real numbers: "I do X% of the work and still find Y% of the change."

**How long does it take to run?**
The first run takes about 25 minutes, because it downloads 36 images. After that the results are saved and it takes a few seconds.

## 10. How to run the demo

```bash
cd Final/demo
uv run green_change.py
```

It prints the numbers above and saves three figures in `demo/output/`.
