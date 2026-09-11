# Assignment 1: Image Classification

I ran the ml5.js image classification example on several images.

## What the model recognizes properly

The model recognizes common animals well. It correctly identified birds and cats. These are everyday objects that show up often in photos, so the model has seen many examples of them.

## What it does not recognize

The model struggled with a person. It also failed on things that emerged recently, like new products or modern devices. It often guessed the wrong label or picked something visually similar instead.

## What affects the classification

Position, scale, and lighting all changed the result. A centered, well-lit, clearly sized object scored higher. When the subject was off to the side, too small, or in dim light, the model got confused and its confidence dropped.

## Why it only recognizes certain things

The model only knows what its training database contains. That database is limited. It was built from a fixed set of images, so anything outside that set, including many people and newer objects, is hard for the model to name correctly.
