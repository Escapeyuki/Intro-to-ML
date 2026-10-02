# Research: Sam Lavigne's Zuckerberg Haircut Archive

I found this project in the [ML Art library](https://mlart.co/). Artist Sam Lavigne ran an open source hair detector on hundreds of photos of Mark Zuckerberg and built an archive of 387 images of his hair. Lavigne called it the most complete archive of Zuckerberg haircuts in existence ([Lavigne's post on X](https://x.com/sam_lavigne/status/1229097648818446336), [AV Club](https://www.avclub.com/machine-learnings-most-terrifying-product-yet-an-archi-1841817959)). The joke is that Zuckerberg has nearly limitless haircut options and keeps the same one. The archive is a pile of near-identical haircuts.

## What type of model did the creator use?

The ML Art library lists it as semantic segmentation. Semantic segmentation is a computer vision technique that assigns a specific class label to every single pixel in an image. This means the model labels every pixel in a photo as hair or not hair, so it can cut out only the hair. Search results say the code came from [YBIGTA/pytorch-hair-segmentation](https://github.com/YBIGTA/pytorch-hair-segmentation).

## What data might have been used to train it?

The training data is Figaro-1k. It has 1,050 photos of people, each with a hair mask drawn by hand as the answer key. The photos are split into 7 hairstyle classes with 150 images each: straight, wavy, curly, kinky, braids, dreadlocks, and short men's hair ([HairAnalysis repo](https://github.com/UmarSpa/HairAnalysis), [Figaro paper page](https://www.researchgate.net/publication/311758818_Figaro_hair_detection_and_segmentation_in_the_wild)).

The photos of Zuckerberg were the input, not training data. I did not find where Lavigne got them. I also could not find where the Figaro-1k photos came from or whether the people agreed to be included. This is the same provenance question from our Assignment 3 reading.

## Why did the creator choose this model?

Segementaion in this case is more useful than other models. A face detector only draws a box around the head, but segmentation cuts out the hair itself. The AV Club says he explores how automation and surveillance technology can be used in unexpected ways. Using a serious research tool to collect one billionaire's haircuts is a good example of that.


## Sources

- [ML Art library (Emil Wallner)](https://mlart.co/)
- [Sam Lavigne's post on X](https://x.com/sam_lavigne/status/1229097648818446336)
- [AV Club: archive of Mark Zuckerberg haircuts](https://www.avclub.com/machine-learnings-most-terrifying-product-yet-an-archi-1841817959)
- [YBIGTA/pytorch-hair-segmentation (GitHub)](https://github.com/YBIGTA/pytorch-hair-segmentation)
- [UmarSpa/HairAnalysis, Figaro-1k description (GitHub)](https://github.com/UmarSpa/HairAnalysis)
- [Figaro: hair detection and segmentation in the wild (ResearchGate)](https://www.researchgate.net/publication/311758818_Figaro_hair_detection_and_segmentation_in_the_wild)

# Sketch
I started from the "Nooo" sketch. I wanted to make an interative sketch of an eye. I used the distance as the gap between two eyelids, so the user can control the closing and openings of the eye with their fingers. I also made color change to the pupil using map: after a certain amount of time, the pupil becomes red over time.