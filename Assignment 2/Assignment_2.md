# Assignment 2

## Section 1: First Edition Context (Reading Reflection)

### The relationship between labels and images

Images do not explain themselves. A label is added by a person, not found in the picture. This link is unstable and subjective. The same photo can hold many meanings, but one chosen label fixes it as truth.

### Who has the power to label images

Dataset creators hold this power. Researchers pick the taxonomy, and low paid crowd workers apply tags at scale. Their choices, biases, and assumptions become built into categories that later feel neutral and objective, even when they are not.

### How labels and models impact society

ImageNet even placed slurs and judgments like "loser" inside its "Person" class. Models trained on such labels enter hiring, policing, and surveillance. They repeat old prejudice while claiming to be scientific, so harmful bias becomes automated and hidden inside systems.

### My reflection

This reading shows classification is a political act, not just math. Deciding who counts and how they are named shapes real lives. As future builders, we must question our labels and ask whose worldview a dataset quietly makes into fact.

## Section 2: Coding Exercise Guidelines

### Task

Train your own image or sound classifier using Teachable Machine. Apply the model to an interactive p5.js sketch. Use the provided code examples as a starting point.

### Deliverables

Document your reading reflections and coding exercise in a blog post. Add a link to the post and your p5 sketch on the Assignment 2 Wiki page. Include visual documentation such as screen captures, video, or GIFs.

### Thoughts on transfer learning

Labeling things and the elements in the picture correctly is very important and affects the result a lot. For example, my background class was a plain white wall, and my person class was me sitting on a chair.

The problem showed up with an empty chair. When only the chair was in view, the model still gave the person class the highest confidence. It learned the chair as part of "person," not just me.

### Thoughts on Teachable Machine

Teachable Machine transfer learning works very well and is fast to train. However, I noticed a discrepancy. The confidence percentages shown inside Teachable Machine did not match the results I got when running the same model in my p5.js sketch.

### Visual documentation

![Training the background class in Teachable Machine](images/tm-background-class.png)

![Training the person class in Teachable Machine](images/tm-person-class.png)

![Empty chair predicted as person](images/tm-empty-chair.png)

![p5.js sketch running the model](images/p5-sketch-result.png)

![Confidence discrepancy between Teachable Machine and p5](images/confidence-discrepancy.gif)
