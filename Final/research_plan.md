# Research Plan: Models and Optimization

Two parts. Part A compares models that find green space. Part B tests the idea of only analyzing what changed.

## Part A: Which model finds green space best?

Every model gets the same tiles and answers the same question: which pixels are green space?

| # | Model | What it is | Learns from data? | Speed | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | NDVI threshold | A formula: (NIR − red) / (NIR + red), green if above 0.4 | No | Instant | Done in the demo |
| 2 | Random forest | Many small decision trees that vote, using all the color bands of a pixel | Yes, on labeled pixels | Fast | Week 1 |
| 3 | Small CNN (U-Net) | A convolutional network like Assignment 8, but it labels every pixel instead of the whole picture | Yes, on labeled tiles | Slow | Week 2 |
| 4 | Dynamic World | Google's ready-made land cover model for Sentinel-2. It separates trees, grass, crops, and built area | Already trained | No training, needs a Google Earth Engine account | Week 2, as a comparison |
| 5 | Gemini with image input | Send a before and after tile and ask "what changed here?" | Already trained | Very slow, limited requests per day | Week 2, only on changed tiles |
| 6 | Change-detection networks | Networks that take two images and output the change directly (Siamese networks) | Yes | Slow | Document only |

**Answer key:** NYC's 2017 Land Cover map on NYC Open Data. It was made from LiDAR and aerial photos at 6 inch resolution, so it is far more detailed than my 10 m pixels. I shrink it to 10 m and use it to train models 2 and 3 and to grade all of them on summer 2017 or 2018.

**What I measure for each model**

- Accuracy against the answer key (how many pixels it gets right, and what it gets wrong).
- Time per tile on my laptop.
- What it can tell apart. NDVI only says "green or not". Dynamic World can say "trees" or "grass". Gemini can say "a parking lot became a lawn".

**What I expect:** NDVI will be hard to beat for "green or not", because near-infrared light is such a strong signal for plants. The learned models should win on harder questions, like telling a green roof from a park, or dry grass from bare ground. If NDVI wins everything, that is a result too.

## Part B: Only look at what changed

### The idea

A slow model takes the same time on a tile whether or not anything happened there. But most of the city does not change in a year. So:

1. A **cheap check** looks at every tile and gives it a change score.
2. Tiles with a low score are skipped. Their old answer is reused.
3. Only tiles with a high score go to the **slow model**.

The cheap check is like a security guard watching the cameras. The slow model is the detective. You don't send the detective to every room every day.

### Experiments

| # | Question | How I test it | Status |
| --- | --- | --- | --- |
| B1 | Is change really concentrated in a few tiles? | Count changed pixels per tile, sort, plot the curve | Done in the demo |
| B2 | Which cheap check is best? | Compare four scores: NDVI difference, plain RGB difference, a low-resolution preview, and a small CNN's features | Week 2 |
| B3 | Where should the cutoff be? | Slide the cutoff and plot "tiles sent to the slow model" against "change found" | Week 2 |
| B4 | What tile size works best? | Repeat with 160 m, 320 m, and 640 m tiles | Week 2 |
| B5 | How much time does it save over nine years? | Run the slow model on everything, then run it with the gate and a cache, and time both | Week 2 |
| B6 | Cheap satellite as guard, sharp photo as detective | Use 10 m Sentinel-2 to pick tiles, then open the 0.6 m NAIP photo only there | Stretch |

### How I grade the gate

First I run the slow model on **every** tile once. That is the full answer. Then I run it again with the gate and compare.

- **Found:** what share of the real change did the gated run still catch?
- **Work:** what share of tiles did the slow model have to process?
- **Time and cost:** seconds on my laptop, and for Gemini, number of requests.

The goal is a simple sentence: "With the gate, I do X% of the work and still find Y% of the change."

### Things that can fool the gate

| Problem | Why it happens | What I do about it |
| --- | --- | --- |
| Clouds and their shadows | A cloud looks like a huge change | Use the satellite's own cloud mask and take the median of several summer images |
| Seasons | Trees have no leaves in winter | Only compare summer to summer |
| A dry summer | Brown grass looks like lost green | Check the next year. Real loss stays lost. Dry grass comes back |
| Slow change | A young tree grows a little every year. No single year crosses the cutoff, but over six years it adds up | Compare each tile to the last year it was **analyzed**, not just to last year. Video compression does the same thing with keyframes |
| Edges | A pixel half on grass and half on pavement flips back and forth | Only count a pixel as changed if its NDVI moved by more than 0.2 |

### Why this matters outside my project

The same trick shows up in many places. Video files store one full frame and then only what moved. A code compiler only rebuilds the files you edited. In my Assignment 9 game, I saved one picture per room and only asked Gemini to redraw when something in the room changed, because a picture cost 8 times more tokens than text. This project asks the same question at the size of a city.

## Tools

- Python with `rasterio` (read satellite files), `numpy`, `matplotlib`, `scikit-learn` (random forest), `torch` (CNN).
- Sentinel-2 images from the Earth Search catalog. Free, no account.
- p5.js for the final interactive viewer.
