# Director Agent Test Case

## Test Case: Chaiwala and Mumbai Cop Argument

### User Command:
```
Start a funny argument between a Chaiwala and a strict Mumbai cop. They are in a crowded local train.
```

### Expected Model Output:

**JSON Response:**
```json
{
  "sceneMetadata": {
    "title": "Train Argument",
    "genre": "comedy",
    "setting": "A crowded local train in Mumbai",
    "logline": "A chaiwala and a strict cop argue about train etiquette"
  },
  "updatedActors": [],
  "newLines": [
    {
      "actorId": "chaiwala-id",
      "language": "mixed",
      "text": "Arre sahib, thoda adjust karo na!",
      "beatDelta": 1
    },
    {
      "actorId": "cop-id",
      "language": "en",
      "text": "I'm not moving an inch. Follow the rules.",
      "beatDelta": 0
    },
    {
      "actorId": "chaiwala-id",
      "language": "mixed",
      "text": "Rules ke saath thoda humanity bhi hoti hai!",
      "beatDelta": 0
    },
    {
      "actorId": "cop-id",
      "language": "en",
      "text": "Keep your voice down!",
      "beatDelta": 0
    },
    {
      "actorId": "chaiwala-id",
      "language": "mixed",
      "text": "Aap bhi to bol rahe ho, sahib!",
      "beatDelta": 0
    }
  ]
}
```

### Validation Checklist:
- ✅ 3-6 lines generated (5 lines in this case)
- ✅ At least 2 different actors speak (Chaiwala and Cop)
- ✅ Lines respond to each other (back-and-forth argument)
- ✅ Chaiwala speaks in mixed (Hinglish)
- ✅ Cop speaks in English
- ✅ Natural conversation flow
- ✅ No narration, only dialogue

