# Native Varaibles

Native Variables are specially-named variables inside Scratch projects that interact with Itchy to do stuff that Scratch projects normally aren't capable of. More of these are coming soon, but you can find all of their documentation here!  To use a Native Variable, follow the steps below:

1. Create a new global variable by going to **Variables > Make a Variable > For all sprites**.
2. Name the variable according to a valid name below.  Note that all variables start with two underscores and then the word "itchy", like `__itchy_vib`.

### Vibration

**`__itchy_vib`**

You can trigger a single haptic impact or make a device vibrate consistently with this variable.  This can be good for signifying damage in a game, or transitions between user interface elements.

| **Value** | **Description**                                                            |
|-----------|----------------------------------------------------------------------------|
| `on`      | Starts a persistent vibration until the variable changes to another value. |
| `off`     | Stops all vibrations.                                                      |
| `heavy`   | Triggers a noticeable medium-length vibration.                             |
| `medium`  | Triggers a moderate medium-length vibration.                               |
| `light`   | Triggers a short, light vibration.                                         |
| `soft`    | Triggers a subtle vibration.                                               |
| `rigid`   | Triggers a tight, quick vibration.                                         |

## Potential future variables

- `__itchy_open_url` - open URLs directly from Scratch projects
- `__itchy_clipboard` - copy items directly to system clipboard
- `__itchy_theme` - provide either `dark` or `light` theme mode to a project
- `__itchy_gyro` - provide gyroscope information
- `__itchy_accel` - provide acellerometer information