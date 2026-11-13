# Final Project Plan: Green Diff

Working title: **Green Diff: watching NYC's green space change from space**

## One sentence

I use free satellite images to measure how NYC's green space changed each year, and I only run the slow AI model on the small parts of the city that actually changed.

## The two questions

1. **Trend question:** Is NYC getting greener or less green, and where?
2. **Optimization question:** Two images taken one year apart are mostly the same. If I only analyze the parts that changed, how much work do I save, and how much do I miss?

## What I will make

- A Python pipeline that downloads one summer image per year, finds the green areas, and compares the years.
- A "change gate": a cheap check that decides which map tiles are worth sending to a slow model.
- A comparison of a few models on the same tiles (see `research_plan.md`).
- A small interactive web page (p5.js) where you slide through the years and click the places that changed.

## Data

| Source | Detail | Years | Cost |
| --- | --- | --- | --- |
| Sentinel-2 (ESA) | 10 m per pixel, has near-infrared | 2018 to 2026 | free, no account |
| NAIP (USDA) | about 0.6 m per pixel, has near-infrared | every 2 to 3 years | free |
| NYC Land Cover 2017 | 6 inch, made from LiDAR, on NYC Open Data | 2017 | free, used as the answer key |

The demo uses Sentinel-2 only. NAIP and the land cover map are for weeks 2 and 3.

## Steps and how I check each one

1. **Get the images** → check: one clean summer picture per year, no clouds over the area.
2. **Find green** with NDVI (a formula using red and near-infrared light) → check: Central Park is green, the East River is not.
3. **Compare years** → check: the change map points at real places I can look up.
4. **Build the change gate** → check: a curve that shows "tiles analyzed" against "change found".
5. **Compare models** on the changed tiles → check: a table with accuracy, time, and cost for each.
6. **Build the web page** → check: a classmate can use it without me explaining.
7. **User test and write the documentation** → due December 8.

## Schedule

| Dates | Goal |
| --- | --- |
| Nov 13 | Proposal. Demo already runs on real data. |
| Nov 14 to 20 | Clean pipeline for the whole city. First model comparison. |
| Nov 21 to 27 | Change gate experiments. Start the web page. |
| Nov 28 to Dec 3 | Finish the web page, user testing, fix what confuses people. |
| Dec 4 | Final presentation. |
| Dec 8 | Documentation due. |

## Scope

Small version (must finish): one area of NYC, Sentinel-2, NDVI plus one learned model, the change gate, a simple viewer.

Big version (document, don't build): the whole city at 0.6 m, deep change-detection models, a public map.

## Biggest risks

- **The demo box includes a strip of New Jersey.** The two biggest losses it found are there. First job in week 1: clip the map to the NYC boundary.
- **"Mostly the same" is true for the city, not for the pixels.** Clouds, shadows, seasons, and dry summers all change the pixels even when nothing was built or planted. I compare summer to summer and take the median of several images to reduce this.
- **10 m pixels are big.** A single street tree is smaller than one pixel. I can see parks and lots, not individual trees.
- **A dry year looks like lost green.** I need to separate "the grass was brown that August" from "the park is gone".
