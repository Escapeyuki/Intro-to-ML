# Green Diff: Presentation Script

<!-- DRAFT: rewrite in your own words. About 5 minutes when read aloud. -->
<!-- The Inspiration and Audience parts are guesses. Change them to what is true for you. -->

## Slide 1: Title

**Say:**

My project is called Green Diff. I use satellite images to see how New York's green space changes every year. And I try to do it the lazy way: only look at the parts that changed.

## Slide 2: Spot the difference

*Show: two almost identical pictures side by side.*

**Say:**

You know those "spot the difference" puzzles? Two pictures that look the same, and you have to find five small changes.

Nobody solves those by studying every corner of both pictures. Your eyes skip the parts that match and jump to the parts that don't.

A city from space is the same puzzle. Take a picture this summer and a picture last summer. Almost everything is the same. The buildings didn't move. The rivers didn't move. But somewhere, a park opened, or a lot got paved.

## Slide 3: What I'm making

**Say:**

One sentence: I use free satellite images to measure how NYC's green space changed each year, and I only run the slow AI model on the small parts of the city that actually changed.

So there are two questions. First, where is the city gaining or losing green? Second, how much work can I skip by only looking at what changed, and what do I miss when I skip?

## Slide 4: How a satellite sees plants

*Show: `demo/output/2_change_map.png`, left two panels.*

**Say:**

The satellite is called Sentinel-2. The images are free. Each pixel is 10 meters wide.

It sees a kind of light we can't see, called near-infrared. Plants soak up red light to make food, and they bounce near-infrared light away. So to this camera, healthy plants glow.

There's a simple formula that compares those two kinds of light. It's called NDVI. High number means plants. Low number means water, roads, and roofs.

This is my demo running on real data. Nine summers, 2018 to 2026. You can see Central Park right there.

## Slide 5: A story the satellite found

*Show: `demo/output/2_change_map.png`, right panel. Point at the pink strip on the lower right edge of Manhattan.*

**Say:**

Green means gained. Pink means lost.

Look at this pink strip on the Lower East Side. I didn't tell the program to look there. It found it.

That's East River Park. Starting in late 2021, the city tore up big parts of it to raise the land and protect the neighborhood from flooding. In my data, the green there stays steady through 2021 and then drops year after year.

So one pink strip is also a story about a neighborhood trading trees today for flood protection later.

## Slide 6: Is the lazy way worth it?

*Show: `demo/output/3_concentration.png`.*

**Say:**

Now the optimization. I cut the map into tiles and counted the change in each one.

In one year, only about half a percent of the pixels change. So my guess was right: most of the image is the same.

But the change is sprinkled around. With big tiles, 320 meters wide, I'd still have to check 30% of them to find 90% of the change. With small tiles, 80 meters wide, I only need 7%.

So the idea works, and the tile size matters a lot.

## Slide 7: What's next

**Say:**

Right now my "model" is just a formula. Next I'll compare real models: a random forest, a small CNN like the one from our CNN week, Google's land cover model, and Gemini looking at before and after pictures.

Those are slow. That's where skipping tiles really pays off. In my text adventure, a picture cost 8 times more than text, so I only redrew a room when it changed. This is the same trick for a whole city.

For the final, I want a web page where you slide through the years and click the places that changed.

## Slide 8: Audience and challenges

**Say:**

This is for people who live here. I want you to find your own block and see what happened to it.

My biggest challenge is that pixels change even when the city doesn't. Clouds, shadows, and a dry August all look like change. And 10 meter pixels are too big to see one street tree.

My question for you: what place in New York would you want to check first?

---

## For the blog post

**Title:** Green Diff

**One sentence:** I use free satellite images to measure how NYC's green space changed each year, and I only run the slow AI model on the small parts of the city that actually changed.

**Abstract (about 250 words):**

Green Diff is a study of New York City's green space from 2018 to 2026, made with free Sentinel-2 satellite images. For each summer, I combine four clear images into one and compute NDVI, a formula that uses red and near-infrared light to show where plants are. Comparing the years gives a map of where green was gained and where it was lost.

The project has two halves. The first is about the city. The map points at real places and real decisions. One example is East River Park on the Lower East Side, where large parts of the park were torn up starting in late 2021 for a flood protection project. The program found it without being told where to look.

The second half is about the machine. Two images taken a year apart are almost the same. In my demo, only about 0.5% of pixels change in a year. Running a slow model on every tile, every year, wastes most of its time on places where nothing happened. So I am building a "change gate": a cheap check that decides which tiles are worth a closer look. I will measure how much work it saves and how much change it misses, and compare several models on the tiles that pass: a random forest, a small CNN, Google's Dynamic World, and Gemini.

The final piece is an interactive web page where you can slide through the years and click on the places that changed.

**Inspiration:** <!-- TODO: your real reason. Ideas: Assignment 9's "one picture per room" trick, the Knowing Machines reading "Models All the Way Down", a park near you that changed. -->

**Visual references:** the three figures in `demo/output/`.

**Audience:** People who live in NYC. They explore the map and look for their own neighborhood.

**Challenges:** Telling real change from clouds, shadows, and dry summers. Pixels that are 10 m wide. Finding a slow model that is worth gating.

**Code sketch:** `demo/green_change.py`
