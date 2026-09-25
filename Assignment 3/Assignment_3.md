# Mixing Movement and Machine

Maya Man worked with choreographer Bill T. Jones to build *Body, Movement, Language*, a set of browser experiments using PoseNet and speech. What stood out to me was Bill's first question. He did not ask "What can it do?" He asked "What do I want from it?" Most of us get excited about features first and look for a purpose later.

Over four workshops, Bill cut Maya's busy prototypes down to what he needed. One looked "like a screen saver" to him, so it became one body point and one line of spoken text. The result, *Manifesto*, lets dancers drag their spoken words around with their bodies. The story comes first, and the technology stays in the background.

I also noticed that PoseNet struggles with unusual dance poses. A model trained on everyday bodies has trouble with the most expressive ones. Bill's test stayed with me: can you "make those dots make somebody cry"?

# Humans of AI

Schmitt shows that AI is not magic. The COCO dataset has 328,000 images scraped from Flickr without the photographers' consent, and many of those photos were never credited. Crowdworkers spent about 70,000 hours labeling them without individual recognition. His project coCOCO traced the photographers and gave them certificates of appreciation. One photo labeled "dog playing with frisbee" turned out to be part of a ten-year family record of a dog named Gryfe. To the dataset it was one sample. To the family it was a memory.



# Open Sourcing the Origin Stories

Ellen Nickles traced where the pretrained models in ml5.js come from and wrote a "biography" for each model and dataset. The biographies answer basic questions: who made it, when, how, why, and for whom. What surprised me was how uneven the answers were. SpeechCommands18w was clearly documented, but for the Face-API datasets nobody could say who collected the images or how. Only 7 of the 14 datasets got complete biographies.

## Questions I Still Have

- What are some ways that we can perform ethical data collection and training, what are some percautions, or what should we add to the workflow? 

## What I Would Add to the Biography

- Consent
- Known limitations, such as body types, skin tones, or accents the model handles poorly
- Credit for the people who labeled the data


## How Provenance Informs My Creative Process

THe origin source of the models show that what the models outputs are partly based on their inputs. 
Provenance lets me think about how important crediting the origin source is. Human are judged based on their work's originality, and people who had commited plagirism are critized most of the time. Maybe we should apply the same values to data as well. But it is very hard to define the clear edge of this field.