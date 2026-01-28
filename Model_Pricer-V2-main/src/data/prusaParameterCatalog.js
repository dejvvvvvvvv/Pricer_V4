// Auto-generated catalog of PrusaSlicer FFF CLI configuration options.
// Source: prusa_help_fff.txt (PrusaSlicer 2.7.2+UNKNOWN) – `--help-fff`.
// Notes:
// - `key` uses underscore form (internal config key).
// - `cliKey` uses hyphen form (as shown in CLI help).
// - `uiLevel` is the minimum UI level to show this parameter (basic/mid/pro).

export const PRUSA_PARAMETER_CATALOG = [
  {
    "key": "arc_fitting",
    "cliKey": "arc-fitting",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Arc Fitting",
      "en": "Arc Fitting"
    },
    "help": {
      "cs": "",
      "en": "Enable to get a G-code file which has G2 and G3 moves. G-code resolution will be\nused as the fitting tolerance. (disabled, emit_center; default: disabled)"
    },
    "dataType": "enum",
    "defaultValue": "disabled",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "disabled",
        "label": "disabled"
      },
      {
        "value": "emit_center",
        "label": "emit_center"
      }
    ]
  },
  {
    "key": "autoemit_temperature_commands",
    "cliKey": "autoemit-temperature-commands",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Autoemit Temperature Commands",
      "en": "Autoemit Temperature Commands"
    },
    "help": {
      "cs": "",
      "en": "When enabled, PrusaSlicer will check whether your Custom Start G-Code contains\nM104 or M190. If so, the temperatures will not be emitted automatically so\nyou're free to customize the order of heating commands and other custom actions.\nNote that you can use placeholder variables for all PrusaSlicer settings, so you\ncan put a \"M109 S[first_layer_temperature]\" command wherever you want. If your\nCustom Start G-Code does NOT contain M104 or M190, PrusaSlicer will execute the\nStart G-Code after bed reached its target temperature and extruder just started\nheating. When disabled, PrusaSlicer will NOT emit commands to heat up extruder\nand bed, leaving both to Custom Start G-Code."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "avoid_crossing_curled_overhangs",
    "cliKey": "avoid-crossing-curled-overhangs",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Avoid Crossing Curled Overhangs",
      "en": "Avoid Crossing Curled Overhangs"
    },
    "help": {
      "cs": "",
      "en": "Plan travel moves such that the extruder avoids areas where the filament may be\ncurled up. This is mostly happening on steeper rounded overhangs and may cause a\ncrash with the nozzle. This feature slows down both the print and the G-code\ngeneration."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "avoid_crossing_perimeters",
    "cliKey": "avoid-crossing-perimeters",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Avoid Crossing Perimeters",
      "en": "Avoid Crossing Perimeters"
    },
    "help": {
      "cs": "",
      "en": "Optimize travel moves in order to minimize the crossing of perimeters. This is\nmostly useful with Bowden extruders which suffer from oozing. This feature slows\ndown both the print and the G-code generation."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "bed_custom_model",
    "cliKey": "bed-custom-model",
    "group": "Misc",
    "uiLevel": "pro",
    "label": {
      "cs": "Bed Custom Model",
      "en": "Bed Custom Model"
    },
    "help": {
      "cs": "",
      "en": ""
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "bed_custom_texture",
    "cliKey": "bed-custom-texture",
    "group": "Misc",
    "uiLevel": "pro",
    "label": {
      "cs": "Bed Custom Texture",
      "en": "Bed Custom Texture"
    },
    "help": {
      "cs": "",
      "en": ""
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "bed_shape",
    "cliKey": "bed-shape",
    "group": "Misc",
    "uiLevel": "pro",
    "label": {
      "cs": "Bed Shape",
      "en": "Bed Shape"
    },
    "help": {
      "cs": "",
      "en": "(default: 0x0,200x0,200x200,0x200)"
    },
    "dataType": "string",
    "defaultValue": "0x0,200x0,200x200,0x200",
    "defaultActiveForSlicing": false
  },
  {
    "key": "bed_temperature",
    "cliKey": "bed-temperature",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Bed Temperature",
      "en": "Bed Temperature"
    },
    "help": {
      "cs": "",
      "en": "N Bed temperature for layers after the first one. Set this to zero to disable bed\ntemperature control commands in the output. (°C, default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": true,
    "unit": "°C"
  },
  {
    "key": "before_layer_gcode",
    "cliKey": "before-layer-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Before Layer GCODE",
      "en": "Before Layer GCODE"
    },
    "help": {
      "cs": "",
      "en": "This custom code is inserted at every layer change, right before the Z move.\nNote that you can use placeholder variables for all Slic3r settings as well as\n[layer_num] and [layer_z]."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "between_objects_gcode",
    "cliKey": "between-objects-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Between Objects GCODE",
      "en": "Between Objects GCODE"
    },
    "help": {
      "cs": "",
      "en": "This code is inserted between objects when using sequential printing. By default\nextruder and bed temperature are reset using non-wait command; however if M104,\nM109, M140 or M190 are detected in this custom code, Slic3r will not add\ntemperature commands. Note that you can use placeholder variables for all Slic3r\nsettings, so you can put a \"M109 S[first_layer_temperature]\" command wherever\nyou want."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "binary_gcode",
    "cliKey": "binary-gcode",
    "group": "Misc",
    "uiLevel": "pro",
    "label": {
      "cs": "Binary GCODE",
      "en": "Binary GCODE"
    },
    "help": {
      "cs": "",
      "en": "Enable, if the firmware supports binary G-code format (bgcode). To generate\n.bgcode files, make sure you have binary G-code enabled in\nConfiguration->Preferences->Other."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "bridge_acceleration",
    "cliKey": "bridge-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Bridge Acceleration",
      "en": "Bridge Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for bridges. Set zero to disable\nacceleration control for bridges. (mm/s², default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "bridge_fan_speed",
    "cliKey": "bridge-fan-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Bridge Fan Speed",
      "en": "Bridge Fan Speed"
    },
    "help": {
      "cs": "",
      "en": "This fan speed is enforced during all bridges and overhangs. (%, default: 100)"
    },
    "dataType": "number",
    "defaultValue": 100,
    "defaultActiveForSlicing": false,
    "unit": "%",
    "step": 1
  },
  {
    "key": "color_change_gcode",
    "cliKey": "color-change-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Color Change GCODE",
      "en": "Color Change GCODE"
    },
    "help": {
      "cs": "",
      "en": "This G-code will be used as a code for the color change (default: M600)"
    },
    "dataType": "string",
    "defaultValue": "M600",
    "defaultActiveForSlicing": false
  },
  {
    "key": "colorprint_heights",
    "cliKey": "colorprint-heights",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Colorprint Heights",
      "en": "Colorprint Heights"
    },
    "help": {
      "cs": "",
      "en": "Heights at which a filament change is to occur. (default: )"
    },
    "dataType": "string",
    "defaultValue": "",
    "defaultActiveForSlicing": false
  },
  {
    "key": "complete_objects",
    "cliKey": "complete-objects",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Complete Objects",
      "en": "Complete Objects"
    },
    "help": {
      "cs": "",
      "en": "When printing multiple objects or copies, this feature will complete each object\nbefore moving onto next one (and starting it from its bottom layer). This\nfeature is useful to avoid the risk of ruined prints. Slic3r should warn and\nprevent you from extruder collisions, but beware."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "cooling",
    "cliKey": "cooling",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Cooling",
      "en": "Cooling"
    },
    "help": {
      "cs": "",
      "en": "This flag enables the automatic cooling logic that adjusts print speed and fan\nspeed according to layer printing time. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "cooling_tube_length",
    "cliKey": "cooling-tube-length",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Cooling Tube Length",
      "en": "Cooling Tube Length"
    },
    "help": {
      "cs": "",
      "en": "Length of the cooling tube to limit space for cooling moves inside it. (mm,\ndefault: 5)"
    },
    "dataType": "number",
    "defaultValue": 5,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "cooling_tube_retraction",
    "cliKey": "cooling-tube-retraction",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Cooling Tube Retraction",
      "en": "Cooling Tube Retraction"
    },
    "help": {
      "cs": "",
      "en": "Distance of the center-point of the cooling tube from the extruder tip. (mm,\ndefault: 91.5)"
    },
    "dataType": "number",
    "defaultValue": 91.5,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "default_acceleration",
    "cliKey": "default-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Default Acceleration",
      "en": "Default Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will be reset to after the role-specific\nacceleration values are used (perimeter/infill). Set zero to prevent resetting\nacceleration at all. (mm/s², default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²",
    "step": 1
  },
  {
    "key": "deretract_speed",
    "cliKey": "deretract-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Deretract Speed",
      "en": "Deretract Speed"
    },
    "help": {
      "cs": "",
      "en": "N The speed for loading of a filament into extruder after retraction (it only\napplies to the extruder motor). If left to zero, the retraction speed is used.\n(mm/s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "disable_fan_first_layers",
    "cliKey": "disable-fan-first-layers",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Disable Fan First Layers",
      "en": "Disable Fan First Layers"
    },
    "help": {
      "cs": "",
      "en": "You can set this to a positive value to disable fan at all during the first\nlayers, so that it does not make adhesion worse. (layers, default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": true,
    "unit": "layers",
    "step": 1
  },
  {
    "key": "draft_shield",
    "cliKey": "draft-shield",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Draft Shield",
      "en": "Draft Shield"
    },
    "help": {
      "cs": "",
      "en": "With draft shield active, the skirt will be printed skirt_distance from the\nobject, possibly intersecting brim. Enabled = skirt is as tall as the highest\nprinted object. Limited = skirt is as tall as specified by skirt_height. This is\nuseful to protect an ABS or ASA print from warping and detaching from print bed\ndue to wind draft. (disabled, limited, enabled; default: disabled)"
    },
    "dataType": "enum",
    "defaultValue": "disabled",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "disabled",
        "label": "disabled"
      },
      {
        "value": "limited",
        "label": "limited"
      },
      {
        "value": "enabled",
        "label": "enabled"
      }
    ]
  },
  {
    "key": "duplicate_distance",
    "cliKey": "duplicate-distance",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Duplicate Distance",
      "en": "Duplicate Distance"
    },
    "help": {
      "cs": "",
      "en": "Distance used for the auto-arrange feature of the plater. (mm, default: 6)"
    },
    "dataType": "number",
    "defaultValue": 6,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "enable_dynamic_fan_speeds",
    "cliKey": "enable-dynamic-fan-speeds",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Enable Dynamic Fan Speeds",
      "en": "Enable Dynamic Fan Speeds"
    },
    "help": {
      "cs": "",
      "en": "This setting enables dynamic fan speed control on overhangs. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "end_filament_gcode",
    "cliKey": "end-filament-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "End Filament GCODE",
      "en": "End Filament GCODE"
    },
    "help": {
      "cs": "",
      "en": "This end procedure is inserted at the end of the output file, before the printer\nend gcode (and before any toolchange from this filament in case of multimaterial\nprinters). Note that you can use placeholder variables for all PrusaSlicer\nsettings. If you have multiple extruders, the gcode is processed in extruder\norder. (default: \"; Filament-specific end gcode \\n;END gcode for filament\\n\")"
    },
    "dataType": "string",
    "defaultValue": "\"; Filament-specific end gcode \\n;END gcode for filament\\n\"",
    "defaultActiveForSlicing": false
  },
  {
    "key": "end_gcode",
    "cliKey": "end-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "End GCODE",
      "en": "End GCODE"
    },
    "help": {
      "cs": "",
      "en": "This end procedure is inserted at the end of the output file. Note that you can\nuse placeholder variables for all PrusaSlicer settings. (default: M104 S0 ; turn\noff temperature\\nG28 X0 ; home X axis\\nM84 ; disable motors\\n)"
    },
    "dataType": "string",
    "defaultValue": "M104 S0 ; turn",
    "defaultActiveForSlicing": false
  },
  {
    "key": "external_perimeter_acceleration",
    "cliKey": "external-perimeter-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "External Perimeter Acceleration",
      "en": "External Perimeter Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for external perimeters. Set zero\nto use the value for perimeters. (mm/s², default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²",
    "step": 1
  },
  {
    "key": "extra_loading_move",
    "cliKey": "extra-loading-move",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extra Loading Move",
      "en": "Extra Loading Move"
    },
    "help": {
      "cs": "",
      "en": "When set to zero, the distance the filament is moved from parking position\nduring load is exactly the same as it was moved back during unload. When\npositive, it is loaded further, if negative, the loading move is shorter than\nunloading. (mm, default: -2)"
    },
    "dataType": "number",
    "defaultValue": -2,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "extruder_clearance_height",
    "cliKey": "extruder-clearance-height",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extruder Clearance Height",
      "en": "Extruder Clearance Height"
    },
    "help": {
      "cs": "",
      "en": "Set this to the vertical distance between your nozzle tip and (usually) the X\ncarriage rods. In other words, this is the height of the clearance cylinder\naround your extruder, and it represents the maximum depth the extruder can peek\nbefore colliding with other printed objects. (mm, default: 20)"
    },
    "dataType": "number",
    "defaultValue": 20,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "extruder_clearance_radius",
    "cliKey": "extruder-clearance-radius",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extruder Clearance Radius",
      "en": "Extruder Clearance Radius"
    },
    "help": {
      "cs": "",
      "en": "Set this to the clearance radius around your extruder. If the extruder is not\ncentered, choose the largest value for safety. This setting is used to check for\ncollisions and to display the graphical preview in the plater. (mm, default: 20)"
    },
    "dataType": "number",
    "defaultValue": 20,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "extruder_colour",
    "cliKey": "extruder-colour",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extruder Colour",
      "en": "Extruder Colour"
    },
    "help": {
      "cs": "",
      "en": "This is only used in the Slic3r interface as a visual help. (default: \"\")"
    },
    "dataType": "string",
    "defaultValue": "\"\"",
    "defaultActiveForSlicing": false
  },
  {
    "key": "extruder_offset",
    "cliKey": "extruder-offset",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extruder Offset",
      "en": "Extruder Offset"
    },
    "help": {
      "cs": "",
      "en": "If your firmware doesn't handle the extruder displacement you need the G-code to\ntake it into account. This option lets you specify the displacement of each\nextruder with respect to the first one. It expects positive coordinates (they\nwill be subtracted from the XY coordinate). (mm, default: 0x0)"
    },
    "dataType": "string",
    "defaultValue": "0x0",
    "defaultActiveForSlicing": false,
    "unit": "mm"
  },
  {
    "key": "extrusion_axis",
    "cliKey": "extrusion-axis",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extrusion Axis",
      "en": "Extrusion Axis"
    },
    "help": {
      "cs": "",
      "en": "Use this option to set the axis letter associated to your printer's extruder\n(usually E but some printers use A). (default: E)"
    },
    "dataType": "string",
    "defaultValue": "E",
    "defaultActiveForSlicing": false
  },
  {
    "key": "extrusion_multiplier",
    "cliKey": "extrusion-multiplier",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Extrusion Multiplier",
      "en": "Extrusion Multiplier"
    },
    "help": {
      "cs": "",
      "en": "This factor changes the amount of flow proportionally. You may need to tweak\nthis setting to get nice surface finish and correct single wall widths. Usual\nvalues are between 0.9 and 1.1. If you think you need to change this more, check\nfilament diameter and your firmware E steps. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "fan_always_on",
    "cliKey": "fan-always-on",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Fan Always On",
      "en": "Fan Always On"
    },
    "help": {
      "cs": "",
      "en": "If this is enabled, fan will never be disabled and will be kept running at least\nat its minimum speed. Useful for PLA, harmful for ABS. (default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": true
  },
  {
    "key": "fan_below_layer_time",
    "cliKey": "fan-below-layer-time",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Fan Below Layer Time",
      "en": "Fan Below Layer Time"
    },
    "help": {
      "cs": "",
      "en": "If layer print time is estimated below this number of seconds, fan will be\nenabled and its speed will be calculated by interpolating the minimum and\nmaximum speeds. (approximate seconds, default: 60)"
    },
    "dataType": "number",
    "defaultValue": 60,
    "defaultActiveForSlicing": false,
    "unit": "approximate seconds",
    "step": 1
  },
  {
    "key": "filament_colour",
    "cliKey": "filament-colour",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Colour",
      "en": "Filament Colour"
    },
    "help": {
      "cs": "",
      "en": "This is only used in the Slic3r interface as a visual help. (default: #29B2B2)"
    },
    "dataType": "string",
    "defaultValue": "#29B2B2",
    "defaultActiveForSlicing": false
  },
  {
    "key": "filament_cooling_final_speed",
    "cliKey": "filament-cooling-final-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Cooling Final Speed",
      "en": "Filament Cooling Final Speed"
    },
    "help": {
      "cs": "",
      "en": "Cooling moves are gradually accelerating towards this speed. (mm/s, default:\n3.4)"
    },
    "dataType": "number",
    "defaultValue": 3.4,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 0.01
  },
  {
    "key": "filament_cooling_initial_speed",
    "cliKey": "filament-cooling-initial-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Cooling Initial Speed",
      "en": "Filament Cooling Initial Speed"
    },
    "help": {
      "cs": "",
      "en": "Cooling moves are gradually accelerating beginning at this speed. (mm/s,\ndefault: 2.2)"
    },
    "dataType": "number",
    "defaultValue": 2.2,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 0.01
  },
  {
    "key": "filament_cooling_moves",
    "cliKey": "filament-cooling-moves",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Cooling Moves",
      "en": "Filament Cooling Moves"
    },
    "help": {
      "cs": "",
      "en": "Filament is cooled by being moved back and forth in the cooling tubes. Specify\ndesired number of these moves. (default: 4)"
    },
    "dataType": "number",
    "defaultValue": 4,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "filament_cost",
    "cliKey": "filament-cost",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Cost",
      "en": "Filament Cost"
    },
    "help": {
      "cs": "",
      "en": "Enter your filament cost per kg here. This is only for statistical information.\n(money/kg, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "money/kg",
    "step": 1
  },
  {
    "key": "filament_density",
    "cliKey": "filament-density",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Density",
      "en": "Filament Density"
    },
    "help": {
      "cs": "",
      "en": "Enter your filament density here. This is only for statistical information. A\ndecent way is to weigh a known length of filament and compute the ratio of the\nlength to volume. Better is to calculate the volume directly through\ndisplacement. (g/cm³, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "g/cm³",
    "step": 1
  },
  {
    "key": "filament_deretract_speed",
    "cliKey": "filament-deretract-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Deretract Speed",
      "en": "Filament Deretract Speed"
    },
    "help": {
      "cs": "",
      "en": "The speed for loading of a filament into extruder after retraction (it only\napplies to the extruder motor). If left to zero, the retraction speed is used.\n(mm/s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "filament_diameter",
    "cliKey": "filament-diameter",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Filament Diameter",
      "en": "Filament Diameter"
    },
    "help": {
      "cs": "",
      "en": "Enter your filament diameter here. Good precision is required, so use a caliper\nand do multiple measurements along the filament, then compute the average. (mm,\ndefault: 1.75)"
    },
    "dataType": "number",
    "defaultValue": 1.75,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "filament_load_time",
    "cliKey": "filament-load-time",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Load Time",
      "en": "Filament Load Time"
    },
    "help": {
      "cs": "",
      "en": "Time for the printer firmware (or the Multi Material Unit 2.0) to load a new\nfilament during a tool change (when executing the T code). This time is added to\nthe total print time by the G-code time estimator. (s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "s",
    "step": 1
  },
  {
    "key": "filament_loading_speed",
    "cliKey": "filament-loading-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Loading Speed",
      "en": "Filament Loading Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed used for loading the filament on the wipe tower. (mm/s, default: 28)"
    },
    "dataType": "number",
    "defaultValue": 28,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "filament_loading_speed_start",
    "cliKey": "filament-loading-speed-start",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Loading Speed Start",
      "en": "Filament Loading Speed Start"
    },
    "help": {
      "cs": "",
      "en": "Speed used at the very beginning of loading phase. (mm/s, default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "filament_max_volumetric_speed",
    "cliKey": "filament-max-volumetric-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Max Volumetric Speed",
      "en": "Filament Max Volumetric Speed"
    },
    "help": {
      "cs": "",
      "en": "Maximum volumetric speed allowed for this filament. Limits the maximum\nvolumetric speed of a print to the minimum of print and filament volumetric\nspeed. Set to zero for no limit. (mm³/s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm³/s",
    "step": 1
  },
  {
    "key": "filament_minimal_purge_on_wipe_tower",
    "cliKey": "filament-minimal-purge-on-wipe-tower",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Minimal Purge On Wipe Tower",
      "en": "Filament Minimal Purge On Wipe Tower"
    },
    "help": {
      "cs": "",
      "en": "After a tool change, the exact position of the newly loaded filament inside the\nnozzle may not be known, and the filament pressure is likely not yet stable.\nBefore purging the print head into an infill or a sacrificial object, Slic3r\nwill always prime this amount of material into the wipe tower to produce\nsuccessive infill or sacrificial object extrusions reliably. (mm³, default: 15)"
    },
    "dataType": "number",
    "defaultValue": 15,
    "defaultActiveForSlicing": false,
    "unit": "mm³",
    "step": 1
  },
  {
    "key": "filament_multitool_ramming",
    "cliKey": "filament-multitool-ramming",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Multitool Ramming",
      "en": "Filament Multitool Ramming"
    },
    "help": {
      "cs": "",
      "en": "Perform ramming when using multitool printer (i.e. when the 'Single Extruder\nMultimaterial' in Printer Settings is unchecked). When checked, a small amount\nof filament is rapidly extruded on the wipe tower just before the toolchange.\nThis option is only used when the wipe tower is enabled. (default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false
  },
  {
    "key": "filament_multitool_ramming_flow",
    "cliKey": "filament-multitool-ramming-flow",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Multitool Ramming Flow",
      "en": "Filament Multitool Ramming Flow"
    },
    "help": {
      "cs": "",
      "en": "Flow used for ramming the filament before the toolchange. (mm³/s, default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "unit": "mm³/s",
    "step": 1
  },
  {
    "key": "filament_multitool_ramming_volume",
    "cliKey": "filament-multitool-ramming-volume",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Multitool Ramming Volume",
      "en": "Filament Multitool Ramming Volume"
    },
    "help": {
      "cs": "",
      "en": "The volume to be rammed before the toolchange. (mm³, default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "unit": "mm³",
    "step": 1
  },
  {
    "key": "filament_notes",
    "cliKey": "filament-notes",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Notes",
      "en": "Filament Notes"
    },
    "help": {
      "cs": "",
      "en": "You can put your notes regarding the filament here. (default: \"\")"
    },
    "dataType": "string",
    "defaultValue": "\"\"",
    "defaultActiveForSlicing": false
  },
  {
    "key": "filament_ramming_parameters",
    "cliKey": "filament-ramming-parameters",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Ramming Parameters",
      "en": "Filament Ramming Parameters"
    },
    "help": {
      "cs": "",
      "en": "This string is edited by RammingDialog and contains ramming specific parameters.\n(default: \"120 100 6.6 6.8 7.2 7.6 7.9 8.2 8.7 9.4 9.9 10.0| 0.05 6.6 0.45 6.8\n0.95 7.8 1.45 8.3 1.95 9.7 2.45 10 2.95 7.6 3.45 7.6 3.95 7.6 4.45 7.6 4.95\n7.6\")"
    },
    "dataType": "string",
    "defaultValue": "\"120 100 6.6 6.8 7.2 7.6 7.9 8.2 8.7 9.4 9.9 10.0| 0.05 6.6 0.45 6.8",
    "defaultActiveForSlicing": false
  },
  {
    "key": "filament_retract_before_travel",
    "cliKey": "filament-retract-before-travel",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Before Travel",
      "en": "Filament Retract Before Travel"
    },
    "help": {
      "cs": "",
      "en": "Retraction is not triggered when travel moves are shorter than this length. (mm,\ndefault: 2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_retract_before_wipe",
    "cliKey": "filament-retract-before-wipe",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Before Wipe",
      "en": "Filament Retract Before Wipe"
    },
    "help": {
      "cs": "",
      "en": "With bowden extruders, it may be wise to do some amount of quick retract before\ndoing the wipe movement. (%, default: 0%)"
    },
    "dataType": "string",
    "defaultValue": "0%",
    "defaultActiveForSlicing": false,
    "unit": "%"
  },
  {
    "key": "filament_retract_layer_change",
    "cliKey": "filament-retract-layer-change",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Layer Change",
      "en": "Filament Retract Layer Change"
    },
    "help": {
      "cs": "",
      "en": "This flag enforces a retraction whenever a Z move is done. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "filament_retract_length",
    "cliKey": "filament-retract-length",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Length",
      "en": "Filament Retract Length"
    },
    "help": {
      "cs": "",
      "en": "When retraction is triggered, filament is pulled back by the specified amount\n(the length is measured on raw filament, before it enters the extruder). (mm\n(zero to disable), default: 2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "filament_retract_length_toolchange",
    "cliKey": "filament-retract-length-toolchange",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Length Toolchange",
      "en": "Filament Retract Length Toolchange"
    },
    "help": {
      "cs": "",
      "en": "When retraction is triggered before changing tool, filament is pulled back by\nthe specified amount (the length is measured on raw filament, before it enters\nthe extruder). (mm (zero to disable), default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "filament_retract_lift",
    "cliKey": "filament-retract-lift",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Lift",
      "en": "Filament Retract Lift"
    },
    "help": {
      "cs": "",
      "en": "Lift height applied before travel. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_retract_lift_above",
    "cliKey": "filament-retract-lift-above",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Lift Above",
      "en": "Filament Retract Lift Above"
    },
    "help": {
      "cs": "",
      "en": "If you set this to a positive value, Z lift will only take place above the\nspecified absolute Z. You can tune this setting for skipping lift on the first\nlayers. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_retract_lift_below",
    "cliKey": "filament-retract-lift-below",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Lift Below",
      "en": "Filament Retract Lift Below"
    },
    "help": {
      "cs": "",
      "en": "If you set this to a positive value, Z lift will only take place below the\nspecified absolute Z. You can tune this setting for limiting lift to the first\nlayers. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_retract_restart_extra",
    "cliKey": "filament-retract-restart-extra",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Restart Extra",
      "en": "Filament Retract Restart Extra"
    },
    "help": {
      "cs": "",
      "en": "When the retraction is compensated after the travel move, the extruder will push\nthis additional amount of filament. This setting is rarely needed. (mm, default:\n0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_retract_restart_extra_toolchange",
    "cliKey": "filament-retract-restart-extra-toolchange",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Restart Extra Toolchange",
      "en": "Filament Retract Restart Extra Toolchange"
    },
    "help": {
      "cs": "",
      "en": "When the retraction is compensated after changing tool, the extruder will push\nthis additional amount of filament. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_retract_speed",
    "cliKey": "filament-retract-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Retract Speed",
      "en": "Filament Retract Speed"
    },
    "help": {
      "cs": "",
      "en": "The speed for retractions (it only applies to the extruder motor). (mm/s,\ndefault: 40)"
    },
    "dataType": "number",
    "defaultValue": 40,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "filament_soluble",
    "cliKey": "filament-soluble",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Soluble",
      "en": "Filament Soluble"
    },
    "help": {
      "cs": "",
      "en": "Soluble material is most likely used for a soluble support. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "filament_spool_weight",
    "cliKey": "filament-spool-weight",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Spool Weight",
      "en": "Filament Spool Weight"
    },
    "help": {
      "cs": "",
      "en": "Enter weight of the empty filament spool. One may weigh a partially consumed\nfilament spool before printing and one may compare the measured weight with the\ncalculated weight of the filament with the spool to find out whether the amount\nof filament on the spool is sufficient to finish the print. (g, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "g",
    "step": 1
  },
  {
    "key": "filament_toolchange_delay",
    "cliKey": "filament-toolchange-delay",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Toolchange Delay",
      "en": "Filament Toolchange Delay"
    },
    "help": {
      "cs": "",
      "en": "Time to wait after the filament is unloaded. May help to get reliable\ntoolchanges with flexible materials that may need more time to shrink to\noriginal dimensions. (s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "s",
    "step": 1
  },
  {
    "key": "filament_travel_lift_before_obstacle",
    "cliKey": "filament-travel-lift-before-obstacle",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Travel Lift Before Obstacle",
      "en": "Filament Travel Lift Before Obstacle"
    },
    "help": {
      "cs": "",
      "en": "If enabled, PrusaSlicer detects obstacles along the travel path and makes the\nslope steeper in case an obstacle might be hit during the initial phase of the\ntravel. (default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false
  },
  {
    "key": "filament_travel_max_lift",
    "cliKey": "filament-travel-max-lift",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Travel Max Lift",
      "en": "Filament Travel Max Lift"
    },
    "help": {
      "cs": "",
      "en": "Maximum lift height of the ramping lift. It may not be reached if the next\nposition is close to the old one. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "filament_travel_ramping_lift",
    "cliKey": "filament-travel-ramping-lift",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Travel Ramping Lift",
      "en": "Filament Travel Ramping Lift"
    },
    "help": {
      "cs": "",
      "en": "Generates a ramping lift instead of lifting the extruder directly upwards. The\ntravel is split into two phases: the ramp and the standard horizontal travel.\nThis option helps reduce stringing. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "filament_travel_slope",
    "cliKey": "filament-travel-slope",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Travel Slope",
      "en": "Filament Travel Slope"
    },
    "help": {
      "cs": "",
      "en": "Slope of the ramp in the initial phase of the travel. (°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "filament_type",
    "cliKey": "filament-type",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Type",
      "en": "Filament Type"
    },
    "help": {
      "cs": "",
      "en": "The filament material type for use in custom G-codes. (PLA, PET, ABS, ASA, FLEX,\nHIPS, EDGE, NGEN, PA, NYLON, PVA, PC, PP, PEI, PEEK, PEKK, POM, PSU, PVDF,\nSCAFF; default: PLA)"
    },
    "dataType": "enum",
    "defaultValue": "PLA",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "PLA",
        "label": "PLA"
      },
      {
        "value": "PET",
        "label": "PET"
      },
      {
        "value": "ABS",
        "label": "ABS"
      },
      {
        "value": "ASA",
        "label": "ASA"
      },
      {
        "value": "FLEX",
        "label": "FLEX"
      },
      {
        "value": "HIPS",
        "label": "HIPS"
      },
      {
        "value": "EDGE",
        "label": "EDGE"
      },
      {
        "value": "NGEN",
        "label": "NGEN"
      },
      {
        "value": "PA",
        "label": "PA"
      },
      {
        "value": "NYLON",
        "label": "NYLON"
      },
      {
        "value": "PVA",
        "label": "PVA"
      },
      {
        "value": "PC",
        "label": "PC"
      },
      {
        "value": "PP",
        "label": "PP"
      },
      {
        "value": "PEI",
        "label": "PEI"
      },
      {
        "value": "PEEK",
        "label": "PEEK"
      },
      {
        "value": "PEKK",
        "label": "PEKK"
      },
      {
        "value": "POM",
        "label": "POM"
      },
      {
        "value": "PSU",
        "label": "PSU"
      },
      {
        "value": "PVDF",
        "label": "PVDF"
      },
      {
        "value": "SCAFF",
        "label": "SCAFF"
      }
    ]
  },
  {
    "key": "filament_unload_time",
    "cliKey": "filament-unload-time",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Unload Time",
      "en": "Filament Unload Time"
    },
    "help": {
      "cs": "",
      "en": "Time for the printer firmware (or the Multi Material Unit 2.0) to unload a\nfilament during a tool change (when executing the T code). This time is added to\nthe total print time by the G-code time estimator. (s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "s",
    "step": 1
  },
  {
    "key": "filament_unloading_speed",
    "cliKey": "filament-unloading-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Unloading Speed",
      "en": "Filament Unloading Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed used for unloading the filament on the wipe tower (does not affect initial\npart of unloading just after ramming). (mm/s, default: 90)"
    },
    "dataType": "number",
    "defaultValue": 90,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "filament_unloading_speed_start",
    "cliKey": "filament-unloading-speed-start",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Unloading Speed Start",
      "en": "Filament Unloading Speed Start"
    },
    "help": {
      "cs": "",
      "en": "Speed used for unloading the tip of the filament immediately after ramming.\n(mm/s, default: 100)"
    },
    "dataType": "number",
    "defaultValue": 100,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "filament_wipe",
    "cliKey": "filament-wipe",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Filament Wipe",
      "en": "Filament Wipe"
    },
    "help": {
      "cs": "",
      "en": "This flag will move the nozzle while retracting to minimize the possible blob on\nleaky extruders. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "first_layer_acceleration",
    "cliKey": "first-layer-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "First Layer Acceleration",
      "en": "First Layer Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for first layer. Set zero to\ndisable acceleration control for first layer. (mm/s², default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "first_layer_acceleration_over_raft",
    "cliKey": "first-layer-acceleration-over-raft",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "First Layer Acceleration Over Raft",
      "en": "First Layer Acceleration Over Raft"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for first layer of object above\nraft interface. Set zero to disable acceleration control for first layer of\nobject above raft interface. (mm/s², default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "first_layer_bed_temperature",
    "cliKey": "first-layer-bed-temperature",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "First Layer Bed Temperature",
      "en": "First Layer Bed Temperature"
    },
    "help": {
      "cs": "",
      "en": "Heated build plate temperature for the first layer. Set this to zero to disable\nbed temperature control commands in the output. (°C, default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": true,
    "unit": "°C"
  },
  {
    "key": "first_layer_speed",
    "cliKey": "first-layer-speed",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "First Layer Speed",
      "en": "First Layer Speed"
    },
    "help": {
      "cs": "",
      "en": "If expressed as absolute value in mm/s, this speed will be applied to all the\nprint moves of the first layer, regardless of their type. If expressed as a\npercentage (for example: 40%) it will scale the default speeds. (mm/s or %,\ndefault: 30)"
    },
    "dataType": "number",
    "defaultValue": 30,
    "defaultActiveForSlicing": true,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "first_layer_speed_over_raft",
    "cliKey": "first-layer-speed-over-raft",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "First Layer Speed Over Raft",
      "en": "First Layer Speed Over Raft"
    },
    "help": {
      "cs": "",
      "en": "If expressed as absolute value in mm/s, this speed will be applied to all the\nprint moves of the first object layer above raft interface, regardless of their\ntype. If expressed as a percentage (for example: 40%) it will scale the default\nspeeds. (mm/s or %, default: 30)"
    },
    "dataType": "number",
    "defaultValue": 30,
    "defaultActiveForSlicing": false,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "first_layer_temperature",
    "cliKey": "first-layer-temperature",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "First Layer Temperature",
      "en": "First Layer Temperature"
    },
    "help": {
      "cs": "",
      "en": "Nozzle temperature for the first layer. If you want to control temperature\nmanually during print, set this to zero to disable temperature control commands\nin the output G-code. (°C, default: 200)"
    },
    "dataType": "number",
    "defaultValue": 200,
    "defaultActiveForSlicing": true,
    "unit": "°C",
    "step": 1
  },
  {
    "key": "full_fan_speed_layer",
    "cliKey": "full-fan-speed-layer",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Full Fan Speed Layer",
      "en": "Full Fan Speed Layer"
    },
    "help": {
      "cs": "",
      "en": "Fan speed will be ramped up linearly from zero at layer\n\"disable_fan_first_layers\" to maximum at layer \"full_fan_speed_layer\".\n\"full_fan_speed_layer\" will be ignored if lower than \"disable_fan_first_layers\",\nin which case the fan will be running at maximum allowed speed at layer\n\"disable_fan_first_layers\" + 1. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "gcode_comments",
    "cliKey": "gcode-comments",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "GCODE Comments",
      "en": "GCODE Comments"
    },
    "help": {
      "cs": "",
      "en": "Enable this to get a commented G-code file, with each line explained by a\ndescriptive text. If you print from SD card, the additional weight of the file\ncould make your firmware slow down."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "gcode_flavor",
    "cliKey": "gcode-flavor",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "GCODE Flavor",
      "en": "GCODE Flavor"
    },
    "help": {
      "cs": "",
      "en": "Some G/M-code commands, including temperature control and others, are not\nuniversal. Set this option to your printer's firmware to get a compatible\noutput. The \"No extrusion\" flavor prevents PrusaSlicer from exporting any\nextrusion value at all. (reprap, reprapfirmware, repetier, teacup, makerware,\nmarlin, marlin2, klipper, sailfish, mach3, machinekit, smoothie, no-extrusion;\ndefault: reprap)"
    },
    "dataType": "enum",
    "defaultValue": "reprap",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "reprap",
        "label": "reprap"
      },
      {
        "value": "reprapfirmware",
        "label": "reprapfirmware"
      },
      {
        "value": "repetier",
        "label": "repetier"
      },
      {
        "value": "teacup",
        "label": "teacup"
      },
      {
        "value": "makerware",
        "label": "makerware"
      },
      {
        "value": "marlin",
        "label": "marlin"
      },
      {
        "value": "marlin2",
        "label": "marlin2"
      },
      {
        "value": "klipper",
        "label": "klipper"
      },
      {
        "value": "sailfish",
        "label": "sailfish"
      },
      {
        "value": "mach3",
        "label": "mach3"
      },
      {
        "value": "machinekit",
        "label": "machinekit"
      },
      {
        "value": "smoothie",
        "label": "smoothie"
      },
      {
        "value": "no-extrusion",
        "label": "no-extrusion"
      }
    ]
  },
  {
    "key": "gcode_label_objects",
    "cliKey": "gcode-label-objects",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "GCODE Label Objects",
      "en": "GCODE Label Objects"
    },
    "help": {
      "cs": "",
      "en": "Selects whether labels should be exported at object boundaries and in what\nformat. OctoPrint = comments to be consumed by OctoPrint CancelObject plugin.\nFirmware = firmware specific G-code (it will be chosen based on firmware flavor\nand it can end up to be empty). This settings is NOT compatible with Single\nExtruder Multi Material setup and Wipe into Object / Wipe into Infill.\n(disabled, octoprint, firmware; default: disabled)"
    },
    "dataType": "enum",
    "defaultValue": "disabled",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "disabled",
        "label": "disabled"
      },
      {
        "value": "octoprint",
        "label": "octoprint"
      },
      {
        "value": "firmware",
        "label": "firmware"
      }
    ]
  },
  {
    "key": "gcode_resolution",
    "cliKey": "gcode-resolution",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "GCODE Resolution",
      "en": "GCODE Resolution"
    },
    "help": {
      "cs": "",
      "en": "Maximum deviation of exported G-code paths from their full resolution\ncounterparts. Very high resolution G-code requires huge amount of RAM to slice\nand preview, also a 3D printer may stutter not being able to process a high\nresolution G-code in a timely manner. On the other hand, a low resolution G-code\nwill produce a low poly effect and because the G-code reduction is performed at\neach layer independently, visible artifacts may be produced. (mm, default:\n0.0125)"
    },
    "dataType": "number",
    "defaultValue": 0.0125,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "gcode_substitutions",
    "cliKey": "gcode-substitutions",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "GCODE Substitutions",
      "en": "GCODE Substitutions"
    },
    "help": {
      "cs": "",
      "en": "Find / replace patterns in G-code lines and substitute them. (default: )"
    },
    "dataType": "string",
    "defaultValue": "",
    "defaultActiveForSlicing": false
  },
  {
    "key": "high_current_on_filament_swap",
    "cliKey": "high-current-on-filament-swap",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "High Current On Filament Swap",
      "en": "High Current On Filament Swap"
    },
    "help": {
      "cs": "",
      "en": "It may be beneficial to increase the extruder motor current during the filament\nexchange sequence to allow for rapid ramming feed rates and to overcome\nresistance when loading a filament with an ugly shaped tip."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "infill_acceleration",
    "cliKey": "infill-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Infill Acceleration",
      "en": "Infill Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for infill. Set zero to disable\nacceleration control for infill. (mm/s², default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "infill_first",
    "cliKey": "infill-first",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Infill First",
      "en": "Infill First"
    },
    "help": {
      "cs": "",
      "en": "This option will switch the print order of perimeters and infill, making the\nlatter first."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "after_layer_gcode",
    "cliKey": "after-layer-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "After Layer GCODE",
      "en": "After Layer GCODE"
    },
    "help": {
      "cs": "",
      "en": "ABCD, --layer-gcode ABCD\nThis custom code is inserted at every layer change, right after the Z move and\nbefore the extruder moves to the first layer point. Note that you can use\nplaceholder variables for all Slic3r settings as well as [layer_num] and\n[layer_z]."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "max_fan_speed",
    "cliKey": "max-fan-speed",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Max Fan Speed",
      "en": "Max Fan Speed"
    },
    "help": {
      "cs": "",
      "en": "This setting represents the maximum speed of your fan. (%, default: 100)"
    },
    "dataType": "number",
    "defaultValue": 100,
    "defaultActiveForSlicing": true,
    "unit": "%",
    "step": 1
  },
  {
    "key": "max_layer_height",
    "cliKey": "max-layer-height",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Max Layer Height",
      "en": "Max Layer Height"
    },
    "help": {
      "cs": "",
      "en": "This is the highest printable layer height for this extruder, used to cap the\nvariable layer height and support layer height. Maximum recommended layer height\nis 75% of the extrusion width to achieve reasonable inter-layer adhesion. If set\nto 0, layer height is limited to 75% of the nozzle diameter. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "max_print_height",
    "cliKey": "max-print-height",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Max Print Height",
      "en": "Max Print Height"
    },
    "help": {
      "cs": "",
      "en": "Set this to the maximum height that can be reached by your extruder while\nprinting. (mm, default: 200)"
    },
    "dataType": "number",
    "defaultValue": 200,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "max_print_speed",
    "cliKey": "max-print-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Max Print Speed",
      "en": "Max Print Speed"
    },
    "help": {
      "cs": "",
      "en": "N When setting other speed settings to 0 Slic3r will autocalculate the optimal\nspeed in order to keep constant extruder pressure. This experimental setting is\nused to set the highest print speed you want to allow. (mm/s, default: 80)"
    },
    "dataType": "number",
    "defaultValue": 80,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "max_volumetric_extrusion_rate_slope_negative",
    "cliKey": "max-volumetric-extrusion-rate-slope-negative",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Max Volumetric Extrusion Rate Slope Negative",
      "en": "Max Volumetric Extrusion Rate Slope Negative"
    },
    "help": {
      "cs": "",
      "en": "This experimental setting is used to limit the speed of change in extrusion rate\nfor a transition from higher speed to lower speed. A value of 1.8 mm³/s²\nensures, that a change from the extrusion rate of 5.4 mm³/s (0.45 mm extrusion\nwidth, 0.2 mm extrusion height, feedrate 60 mm/s) to 1.8 mm³/s (feedrate 20\nmm/s) will take at least 2 seconds. (mm³/s², default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm³/s²",
    "step": 1
  },
  {
    "key": "max_volumetric_extrusion_rate_slope_positive",
    "cliKey": "max-volumetric-extrusion-rate-slope-positive",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Max Volumetric Extrusion Rate Slope Positive",
      "en": "Max Volumetric Extrusion Rate Slope Positive"
    },
    "help": {
      "cs": "",
      "en": "This experimental setting is used to limit the speed of change in extrusion rate\nfor a transition from lower speed to higher speed. A value of 1.8 mm³/s²\nensures, that a change from the extrusion rate of 1.8 mm³/s (0.45 mm extrusion\nwidth, 0.2 mm extrusion height, feedrate 20 mm/s) to 5.4 mm³/s (feedrate 60\nmm/s) will take at least 2 seconds. (mm³/s², default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm³/s²",
    "step": 1
  },
  {
    "key": "max_volumetric_speed",
    "cliKey": "max-volumetric-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Max Volumetric Speed",
      "en": "Max Volumetric Speed"
    },
    "help": {
      "cs": "",
      "en": "This experimental setting is used to set the maximum volumetric speed your\nextruder supports. (mm³/s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm³/s",
    "step": 1
  },
  {
    "key": "min_fan_speed",
    "cliKey": "min-fan-speed",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Min Fan Speed",
      "en": "Min Fan Speed"
    },
    "help": {
      "cs": "",
      "en": "This setting represents the minimum PWM your fan needs to work. (%, default: 35)"
    },
    "dataType": "number",
    "defaultValue": 35,
    "defaultActiveForSlicing": true,
    "unit": "%",
    "step": 1
  },
  {
    "key": "min_layer_height",
    "cliKey": "min-layer-height",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Min Layer Height",
      "en": "Min Layer Height"
    },
    "help": {
      "cs": "",
      "en": "This is the lowest printable layer height for this extruder and limits the\nresolution for variable layer height. Typical values are between 0.05 mm and 0.1\nmm. (mm, default: 0.07)"
    },
    "dataType": "number",
    "defaultValue": 0.07,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "min_print_speed",
    "cliKey": "min-print-speed",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Min Print Speed",
      "en": "Min Print Speed"
    },
    "help": {
      "cs": "",
      "en": "N Slic3r will not scale speed down below this speed. (mm/s, default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "min_skirt_length",
    "cliKey": "min-skirt-length",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Min Skirt Length",
      "en": "Min Skirt Length"
    },
    "help": {
      "cs": "",
      "en": "Generate no less than the number of skirt loops required to consume the\nspecified amount of filament on the bottom layer. For multi-extruder machines,\nthis minimum applies to each extruder. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "notes",
    "cliKey": "notes",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Notes",
      "en": "Notes"
    },
    "help": {
      "cs": "",
      "en": "You can put here your personal notes. This text will be added to the G-code\nheader comments."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "nozzle_diameter",
    "cliKey": "nozzle-diameter",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Nozzle Diameter",
      "en": "Nozzle Diameter"
    },
    "help": {
      "cs": "",
      "en": "N This is the diameter of your extruder nozzle (for example: 0.5, 0.35 etc.) (mm,\ndefault: 0.4)"
    },
    "dataType": "number",
    "defaultValue": 0.4,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "only_retract_when_crossing_perimeters",
    "cliKey": "only-retract-when-crossing-perimeters",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Only Retract When Crossing Perimeters",
      "en": "Only Retract When Crossing Perimeters"
    },
    "help": {
      "cs": "",
      "en": "Disables retraction when the travel path does not exceed the upper layer's\nperimeters (and thus any ooze will be probably invisible)."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": true
  },
  {
    "key": "ooze_prevention",
    "cliKey": "ooze-prevention",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Ooze Prevention",
      "en": "Ooze Prevention"
    },
    "help": {
      "cs": "",
      "en": "This option will drop the temperature of the inactive extruders to prevent\noozing."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "output_filename_format",
    "cliKey": "output-filename-format",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Output Filename Format",
      "en": "Output Filename Format"
    },
    "help": {
      "cs": "",
      "en": "You can use all configuration options as variables inside this template. For\nexample: [layer_height], [fill_density] etc. You can also use [timestamp],\n[year], [month], [day], [hour], [minute], [second], [version],\n[input_filename_base], [default_output_extension]. (default:\n[input_filename_base].gcode)"
    },
    "dataType": "string",
    "defaultValue": "[input_filename_base].gcode",
    "defaultActiveForSlicing": false
  },
  {
    "key": "overhang_fan_speed_0",
    "cliKey": "overhang-fan-speed-0",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Fan Speed 0",
      "en": "Overhang Fan Speed 0"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Fan speeds for overhang sizes in\nbetween are calculated via linear interpolation. (%, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "%",
    "step": 1
  },
  {
    "key": "overhang_fan_speed_1",
    "cliKey": "overhang-fan-speed-1",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Fan Speed 1",
      "en": "Overhang Fan Speed 1"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Fan speeds for overhang sizes in\nbetween are calculated via linear interpolation. (%, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "%",
    "step": 1
  },
  {
    "key": "overhang_fan_speed_2",
    "cliKey": "overhang-fan-speed-2",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Fan Speed 2",
      "en": "Overhang Fan Speed 2"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Fan speeds for overhang sizes in\nbetween are calculated via linear interpolation. (%, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "%",
    "step": 1
  },
  {
    "key": "overhang_fan_speed_3",
    "cliKey": "overhang-fan-speed-3",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Fan Speed 3",
      "en": "Overhang Fan Speed 3"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Fan speeds for overhang sizes in\nbetween are calculated via linear interpolation. (%, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "%",
    "step": 1
  },
  {
    "key": "parking_pos_retraction",
    "cliKey": "parking-pos-retraction",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Parking Pos Retraction",
      "en": "Parking Pos Retraction"
    },
    "help": {
      "cs": "",
      "en": "Distance of the extruder tip from the position where the filament is parked when\nunloaded. This should match the value in printer firmware. (mm, default: 92)"
    },
    "dataType": "number",
    "defaultValue": 92,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "pause_print_gcode",
    "cliKey": "pause-print-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Pause Print GCODE",
      "en": "Pause Print GCODE"
    },
    "help": {
      "cs": "",
      "en": "This G-code will be used as a code for the pause print (default: M601)"
    },
    "dataType": "string",
    "defaultValue": "M601",
    "defaultActiveForSlicing": false
  },
  {
    "key": "perimeter_acceleration",
    "cliKey": "perimeter-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Perimeter Acceleration",
      "en": "Perimeter Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for perimeters. Set zero to\ndisable acceleration control for perimeters. (mm/s², default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "post_process",
    "cliKey": "post-process",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Post Process",
      "en": "Post Process"
    },
    "help": {
      "cs": "",
      "en": "ABCD If you want to process the output G-code through custom scripts, just list their\nabsolute paths here. Separate multiple scripts with a semicolon. Scripts will be\npassed the absolute path to the G-code file as the first argument, and they can\naccess the Slic3r config settings by reading environment variables. (default: )"
    },
    "dataType": "string",
    "defaultValue": "",
    "defaultActiveForSlicing": false
  },
  {
    "key": "preset_name",
    "cliKey": "preset-name",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Preset Name",
      "en": "Preset Name"
    },
    "help": {
      "cs": "",
      "en": ""
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "preset_names",
    "cliKey": "preset-names",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Preset Names",
      "en": "Preset Names"
    },
    "help": {
      "cs": "",
      "en": "ABCD Names of presets related to the physical printer (default: )"
    },
    "dataType": "string",
    "defaultValue": "",
    "defaultActiveForSlicing": false
  },
  {
    "key": "printer_notes",
    "cliKey": "printer-notes",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Printer Notes",
      "en": "Printer Notes"
    },
    "help": {
      "cs": "",
      "en": "You can put your notes regarding the printer here."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "printer_technology",
    "cliKey": "printer-technology",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Printer Technology",
      "en": "Printer Technology"
    },
    "help": {
      "cs": "",
      "en": "Printer technology (FFF, SLA; default: FFF)"
    },
    "dataType": "enum",
    "defaultValue": "FFF",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "FFF",
        "label": "FFF"
      },
      {
        "value": "SLA",
        "label": "SLA"
      }
    ]
  },
  {
    "key": "remaining_times",
    "cliKey": "remaining-times",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Remaining Times",
      "en": "Remaining Times"
    },
    "help": {
      "cs": "",
      "en": "Emit M73 P[percent printed] R[remaining time in minutes] at 1 minute intervals\ninto the G-code to let the firmware show accurate remaining time. As of now only\nthe Prusa i3 MK3 firmware recognizes M73. Also the i3 MK3 firmware supports M73\nQxx Sxx for the silent mode."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "resolution",
    "cliKey": "resolution",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Resolution",
      "en": "Resolution"
    },
    "help": {
      "cs": "",
      "en": "Minimum detail resolution, used to simplify the input file for speeding up the\nslicing job and reducing memory usage. High-resolution models often carry more\ndetail than printers can render. Set to zero to disable any simplification and\nuse full resolution from input. (mm, default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm"
  },
  {
    "key": "retract_before_travel",
    "cliKey": "retract-before-travel",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Retract Before Travel",
      "en": "Retract Before Travel"
    },
    "help": {
      "cs": "",
      "en": "Retraction is not triggered when travel moves are shorter than this length. (mm,\ndefault: 2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "retract_before_wipe",
    "cliKey": "retract-before-wipe",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Retract Before Wipe",
      "en": "Retract Before Wipe"
    },
    "help": {
      "cs": "",
      "en": "With bowden extruders, it may be wise to do some amount of quick retract before\ndoing the wipe movement. (%, default: 0%)"
    },
    "dataType": "string",
    "defaultValue": "0%",
    "defaultActiveForSlicing": false,
    "unit": "%"
  },
  {
    "key": "retract_layer_change",
    "cliKey": "retract-layer-change",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Retract Layer Change",
      "en": "Retract Layer Change"
    },
    "help": {
      "cs": "",
      "en": "This flag enforces a retraction whenever a Z move is done. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "retract_length",
    "cliKey": "retract-length",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Retract Length",
      "en": "Retract Length"
    },
    "help": {
      "cs": "",
      "en": "When retraction is triggered, filament is pulled back by the specified amount\n(the length is measured on raw filament, before it enters the extruder). (mm\n(zero to disable), default: 2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "retract_length_toolchange",
    "cliKey": "retract-length-toolchange",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Retract Length Toolchange",
      "en": "Retract Length Toolchange"
    },
    "help": {
      "cs": "",
      "en": "When retraction is triggered before changing tool, filament is pulled back by\nthe specified amount (the length is measured on raw filament, before it enters\nthe extruder). (mm (zero to disable), default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "retract_lift",
    "cliKey": "retract-lift",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Retract Lift",
      "en": "Retract Lift"
    },
    "help": {
      "cs": "",
      "en": "Lift height applied before travel. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "retract_lift_above",
    "cliKey": "retract-lift-above",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Retract Lift Above",
      "en": "Retract Lift Above"
    },
    "help": {
      "cs": "",
      "en": "If you set this to a positive value, Z lift will only take place above the\nspecified absolute Z. You can tune this setting for skipping lift on the first\nlayers. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "retract_lift_below",
    "cliKey": "retract-lift-below",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Retract Lift Below",
      "en": "Retract Lift Below"
    },
    "help": {
      "cs": "",
      "en": "If you set this to a positive value, Z lift will only take place below the\nspecified absolute Z. You can tune this setting for limiting lift to the first\nlayers. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "retract_restart_extra",
    "cliKey": "retract-restart-extra",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Retract Restart Extra",
      "en": "Retract Restart Extra"
    },
    "help": {
      "cs": "",
      "en": "When the retraction is compensated after the travel move, the extruder will push\nthis additional amount of filament. This setting is rarely needed. (mm, default:\n0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "retract_restart_extra_toolchange",
    "cliKey": "retract-restart-extra-toolchange",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Retract Restart Extra Toolchange",
      "en": "Retract Restart Extra Toolchange"
    },
    "help": {
      "cs": "",
      "en": "When the retraction is compensated after changing tool, the extruder will push\nthis additional amount of filament. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "retract_speed",
    "cliKey": "retract-speed",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Retract Speed",
      "en": "Retract Speed"
    },
    "help": {
      "cs": "",
      "en": "The speed for retractions (it only applies to the extruder motor). (mm/s,\ndefault: 40)"
    },
    "dataType": "number",
    "defaultValue": 40,
    "defaultActiveForSlicing": true,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "silent_mode",
    "cliKey": "silent-mode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Silent Mode",
      "en": "Silent Mode"
    },
    "help": {
      "cs": "",
      "en": "The firmware supports stealth mode"
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "single_extruder_multi_material",
    "cliKey": "single-extruder-multi-material",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Single Extruder Multi Material",
      "en": "Single Extruder Multi Material"
    },
    "help": {
      "cs": "",
      "en": "The printer multiplexes filaments into a single hot end."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "single_extruder_multi_material_priming",
    "cliKey": "single-extruder-multi-material-priming",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Single Extruder Multi Material Priming",
      "en": "Single Extruder Multi Material Priming"
    },
    "help": {
      "cs": "",
      "en": "If enabled, all printing extruders will be primed at the front edge of the print\nbed at the start of the print."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "skirt_distance",
    "cliKey": "skirt-distance",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Skirt Distance",
      "en": "Skirt Distance"
    },
    "help": {
      "cs": "",
      "en": "Distance between skirt and brim (when draft shield is not used) or objects. (mm,\ndefault: 6)"
    },
    "dataType": "number",
    "defaultValue": 6,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "skirt_height",
    "cliKey": "skirt-height",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Skirt Height",
      "en": "Skirt Height"
    },
    "help": {
      "cs": "",
      "en": "Height of skirt expressed in layers. (layers, default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": true,
    "unit": "layers",
    "step": 1
  },
  {
    "key": "skirts",
    "cliKey": "skirts",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Skirts",
      "en": "Skirts"
    },
    "help": {
      "cs": "",
      "en": "Number of loops for the skirt. If the Minimum Extrusion Length option is set,\nthe number of loops might be greater than the one configured here. Set this to\nzero to disable skirt completely. (default: 1)"
    },
    "dataType": "boolean",
    "defaultValue": true,
    "defaultActiveForSlicing": true
  },
  {
    "key": "slowdown_below_layer_time",
    "cliKey": "slowdown-below-layer-time",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Slowdown Below Layer Time",
      "en": "Slowdown Below Layer Time"
    },
    "help": {
      "cs": "",
      "en": "If layer print time is estimated below this number of seconds, print moves speed\nwill be scaled down to extend duration to this value. (approximate seconds,\ndefault: 5)"
    },
    "dataType": "number",
    "defaultValue": 5,
    "defaultActiveForSlicing": false,
    "unit": "approximate seconds",
    "step": 1
  },
  {
    "key": "solid_infill_acceleration",
    "cliKey": "solid-infill-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Infill Acceleration",
      "en": "Solid Infill Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for solid infill. Set zero to use\nthe value for infill. (mm/s², default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²",
    "step": 1
  },
  {
    "key": "solid_layers",
    "cliKey": "solid-layers",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Layers",
      "en": "Solid Layers"
    },
    "help": {
      "cs": "",
      "en": "Number of solid layers to generate on top and bottom surfaces."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "solid_min_thickness",
    "cliKey": "solid-min-thickness",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Min Thickness",
      "en": "Solid Min Thickness"
    },
    "help": {
      "cs": "",
      "en": "Minimum thickness of a top / bottom shell"
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "spiral_vase",
    "cliKey": "spiral-vase",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Spiral Vase",
      "en": "Spiral Vase"
    },
    "help": {
      "cs": "",
      "en": "This feature will raise Z gradually while printing a single-walled object in\norder to remove any visible seam. This option requires a single perimeter, no\ninfill, no top solid layers and no support material. You can still set any\nnumber of bottom solid layers as well as skirt/brim loops. It won't work when\nprinting more than one single object."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "staggered_inner_seams",
    "cliKey": "staggered-inner-seams",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Staggered Inner Seams",
      "en": "Staggered Inner Seams"
    },
    "help": {
      "cs": "",
      "en": "This option causes the inner seams to be shifted backwards based on their depth,\nforming a zigzag pattern."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "standby_temperature_delta",
    "cliKey": "standby-temperature-delta",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Standby Temperature Delta",
      "en": "Standby Temperature Delta"
    },
    "help": {
      "cs": "",
      "en": "Temperature difference to be applied when an extruder is not active. The value\nis not used when 'idle_temperature' in filament settings is defined. (∆°C,\ndefault: -5)"
    },
    "dataType": "number",
    "defaultValue": -5,
    "defaultActiveForSlicing": false,
    "unit": "∆°C",
    "step": 1
  },
  {
    "key": "start_filament_gcode",
    "cliKey": "start-filament-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Start Filament GCODE",
      "en": "Start Filament GCODE"
    },
    "help": {
      "cs": "",
      "en": "This start procedure is inserted at the beginning, after any printer start gcode\n(and after any toolchange to this filament in case of multi-material printers).\nThis is used to override settings for a specific filament. If PrusaSlicer\ndetects M104, M109, M140 or M190 in your custom codes, such commands will not be\nprepended automatically so you're free to customize the order of heating\ncommands and other custom actions. Note that you can use placeholder variables\nfor all PrusaSlicer settings, so you can put a \"M109 S[first_layer_temperature]\"\ncommand wherever you want. If you have multiple extruders, the gcode is\nprocessed in extruder order. (default: \"; Filament gcode\\n\")"
    },
    "dataType": "string",
    "defaultValue": "\"; Filament gcode\\n\"",
    "defaultActiveForSlicing": false
  },
  {
    "key": "start_gcode",
    "cliKey": "start-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Start GCODE",
      "en": "Start GCODE"
    },
    "help": {
      "cs": "",
      "en": "This start procedure is inserted at the beginning, possibly prepended by\ntemperature-changing commands. See 'autoemit_temperature_commands'. (default:\nG28 ; home all axes\\nG1 Z5 F5000 ; lift nozzle\\n)"
    },
    "dataType": "string",
    "defaultValue": "G28 ; home all axes\\nG1 Z5 F5000 ; lift nozzle\\n",
    "defaultActiveForSlicing": false
  },
  {
    "key": "temperature",
    "cliKey": "temperature",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Temperature",
      "en": "Temperature"
    },
    "help": {
      "cs": "",
      "en": "Nozzle temperature for layers after the first one. Set this to zero to disable\ntemperature control commands in the output G-code. (°C, default: 200)"
    },
    "dataType": "number",
    "defaultValue": 200,
    "defaultActiveForSlicing": true,
    "unit": "°C",
    "step": 1
  },
  {
    "key": "template_custom_gcode",
    "cliKey": "template-custom-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Template Custom GCODE",
      "en": "Template Custom GCODE"
    },
    "help": {
      "cs": "",
      "en": "This G-code will be used as a custom code"
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "thumbnails",
    "cliKey": "thumbnails",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Thumbnails",
      "en": "Thumbnails"
    },
    "help": {
      "cs": "",
      "en": "Picture sizes to be stored into a .gcode / .bgcode and .sl1 / .sl1s files, in\nthe following format: \"XxY/EXT, XxY/EXT, ...\" Currently supported extensions are\nPNG, QOI and JPG."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "thumbnails_format",
    "cliKey": "thumbnails-format",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Thumbnails Format",
      "en": "Thumbnails Format"
    },
    "help": {
      "cs": "",
      "en": "Format of G-code thumbnails: PNG for best quality, JPG for smallest size, QOI\nfor low memory firmware (PNG, JPG, QOI; default: PNG)"
    },
    "dataType": "enum",
    "defaultValue": "PNG",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "PNG",
        "label": "PNG"
      },
      {
        "value": "JPG",
        "label": "JPG"
      },
      {
        "value": "QOI",
        "label": "QOI"
      }
    ]
  },
  {
    "key": "toolchange_gcode",
    "cliKey": "toolchange-gcode",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Toolchange GCODE",
      "en": "Toolchange GCODE"
    },
    "help": {
      "cs": "",
      "en": "This custom code is inserted before every toolchange. Placeholder variables for\nall PrusaSlicer settings as well as {toolchange_z}, {previous_extruder} and\n{next_extruder} can be used. When a tool-changing command which changes to the\ncorrect extruder is included (such as T{next_extruder}), PrusaSlicer will emit\nno other such command. It is therefore possible to script custom behaviour both\nbefore and after the toolchange."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "top_solid_infill_acceleration",
    "cliKey": "top-solid-infill-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Top Solid Infill Acceleration",
      "en": "Top Solid Infill Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for top solid infill. Set zero to\nuse the value for solid infill. (mm/s², default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²",
    "step": 1
  },
  {
    "key": "travel_acceleration",
    "cliKey": "travel-acceleration",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Travel Acceleration",
      "en": "Travel Acceleration"
    },
    "help": {
      "cs": "",
      "en": "This is the acceleration your printer will use for travel moves. Set zero to\ndisable acceleration control for travel. (mm/s², default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "travel_lift_before_obstacle",
    "cliKey": "travel-lift-before-obstacle",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Travel Lift Before Obstacle",
      "en": "Travel Lift Before Obstacle"
    },
    "help": {
      "cs": "",
      "en": "If enabled, PrusaSlicer detects obstacles along the travel path and makes the\nslope steeper in case an obstacle might be hit during the initial phase of the\ntravel. (default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false
  },
  {
    "key": "travel_max_lift",
    "cliKey": "travel-max-lift",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Travel Max Lift",
      "en": "Travel Max Lift"
    },
    "help": {
      "cs": "",
      "en": "N Maximum lift height of the ramping lift. It may not be reached if the next\nposition is close to the old one. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "travel_ramping_lift",
    "cliKey": "travel-ramping-lift",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Travel Ramping Lift",
      "en": "Travel Ramping Lift"
    },
    "help": {
      "cs": "",
      "en": "Generates a ramping lift instead of lifting the extruder directly upwards. The\ntravel is split into two phases: the ramp and the standard horizontal travel.\nThis option helps reduce stringing. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "travel_slope",
    "cliKey": "travel-slope",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Travel Slope",
      "en": "Travel Slope"
    },
    "help": {
      "cs": "",
      "en": "Slope of the ramp in the initial phase of the travel. (°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "travel_speed",
    "cliKey": "travel-speed",
    "group": "Misc",
    "uiLevel": "basic",
    "label": {
      "cs": "Travel Speed",
      "en": "Travel Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for travel moves (jumps between distant extrusion points). (mm/s, default:\n130)"
    },
    "dataType": "number",
    "defaultValue": 130,
    "defaultActiveForSlicing": true,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "travel_speed_z",
    "cliKey": "travel-speed-z",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Travel Speed Z",
      "en": "Travel Speed Z"
    },
    "help": {
      "cs": "",
      "en": "Speed for movements along the Z axis. When set to zero, the value is ignored and\nregular travel speed is used instead. (mm/s, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "use_firmware_retraction",
    "cliKey": "use-firmware-retraction",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Use Firmware Retraction",
      "en": "Use Firmware Retraction"
    },
    "help": {
      "cs": "",
      "en": "This setting uses G10 and G11 commands to have the firmware handle the\nretraction. Note that this has to be supported by firmware."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "use_relative_e_distances",
    "cliKey": "use-relative-e-distances",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Use Relative E Distances",
      "en": "Use Relative E Distances"
    },
    "help": {
      "cs": "",
      "en": "If your firmware requires relative E values, check this, otherwise leave it\nunchecked. Most firmwares use absolute values."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "use_volumetric_e",
    "cliKey": "use-volumetric-e",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Use Volumetric E",
      "en": "Use Volumetric E"
    },
    "help": {
      "cs": "",
      "en": "This experimental setting uses outputs the E values in cubic millimeters instead\nof linear millimeters. If your firmware doesn't already know filament\ndiameter(s), you can put commands like 'M200 D[filament_diameter_0] T0' in your\nstart G-code in order to turn volumetric mode on and use the filament diameter\nassociated to the filament selected in Slic3r. This is only supported in recent\nMarlin."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "variable_layer_height",
    "cliKey": "variable-layer-height",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Variable Layer Height",
      "en": "Variable Layer Height"
    },
    "help": {
      "cs": "",
      "en": "Some printers or printer setups may have difficulties printing with a variable\nlayer height. Enabled by default."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "wipe",
    "cliKey": "wipe",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe",
      "en": "Wipe"
    },
    "help": {
      "cs": "",
      "en": "This flag will move the nozzle while retracting to minimize the possible blob on\nleaky extruders. (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "wipe_tower",
    "cliKey": "wipe-tower",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower",
      "en": "Wipe Tower"
    },
    "help": {
      "cs": "",
      "en": "Multi material printers may need to prime or purge extruders on tool changes.\nExtrude the excess material into the wipe tower."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "wipe_tower_bridging",
    "cliKey": "wipe-tower-bridging",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Bridging",
      "en": "Wipe Tower Bridging"
    },
    "help": {
      "cs": "",
      "en": "Maximal distance between supports on sparse infill sections. (mm, default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "wipe_tower_brim_width",
    "cliKey": "wipe-tower-brim-width",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Brim Width",
      "en": "Wipe Tower Brim Width"
    },
    "help": {
      "cs": "",
      "en": "Wipe tower brim width (mm, default: 2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "wipe_tower_cone_angle",
    "cliKey": "wipe-tower-cone-angle",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Cone Angle",
      "en": "Wipe Tower Cone Angle"
    },
    "help": {
      "cs": "",
      "en": "Angle at the apex of the cone that is used to stabilize the wipe tower. Larger\nangle means wider base. (°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "wipe_tower_extra_spacing",
    "cliKey": "wipe-tower-extra-spacing",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Extra Spacing",
      "en": "Wipe Tower Extra Spacing"
    },
    "help": {
      "cs": "",
      "en": "Spacing of purge lines on the wipe tower. (%, default: 100%)"
    },
    "dataType": "string",
    "defaultValue": "100%",
    "defaultActiveForSlicing": false,
    "unit": "%"
  },
  {
    "key": "wipe_tower_no_sparse_layers",
    "cliKey": "wipe-tower-no-sparse-layers",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower No Sparse Layers",
      "en": "Wipe Tower No Sparse Layers"
    },
    "help": {
      "cs": "",
      "en": "If enabled, the wipe tower will not be printed on layers with no toolchanges. On\nlayers with a toolchange, extruder will travel downward to print the wipe tower.\nUser is responsible for ensuring there is no collision with the print."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "wipe_tower_rotation_angle",
    "cliKey": "wipe-tower-rotation-angle",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Rotation Angle",
      "en": "Wipe Tower Rotation Angle"
    },
    "help": {
      "cs": "",
      "en": "Wipe tower rotation angle with respect to x-axis. (°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "wipe_tower_width",
    "cliKey": "wipe-tower-width",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Width",
      "en": "Wipe Tower Width"
    },
    "help": {
      "cs": "",
      "en": "Width of a wipe tower (mm, default: 60)"
    },
    "dataType": "number",
    "defaultValue": 60,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "wipe_tower_x",
    "cliKey": "wipe-tower-x",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower X",
      "en": "Wipe Tower X"
    },
    "help": {
      "cs": "",
      "en": "X coordinate of the left front corner of a wipe tower (mm, default: 180)"
    },
    "dataType": "number",
    "defaultValue": 180,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "wipe_tower_y",
    "cliKey": "wipe-tower-y",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Y",
      "en": "Wipe Tower Y"
    },
    "help": {
      "cs": "",
      "en": "Y coordinate of the left front corner of a wipe tower (mm, default: 140)"
    },
    "dataType": "number",
    "defaultValue": 140,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "wiping_volumes_extruders",
    "cliKey": "wiping-volumes-extruders",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wiping Volumes Extruders",
      "en": "Wiping Volumes Extruders"
    },
    "help": {
      "cs": "",
      "en": "This vector saves required volumes to change from/to each tool used on the wipe\ntower. These values are used to simplify creation of the full purging volumes\nbelow. (default: 70,70,70,70,70,70,70,70,70,70)"
    },
    "dataType": "string",
    "defaultValue": "70,70,70,70,70,70,70,70,70,70",
    "defaultActiveForSlicing": false
  },
  {
    "key": "wiping_volumes_matrix",
    "cliKey": "wiping-volumes-matrix",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Wiping Volumes Matrix",
      "en": "Wiping Volumes Matrix"
    },
    "help": {
      "cs": "",
      "en": "This matrix describes volumes (in cubic milimetres) required to purge the new\nfilament on the wipe tower for any given pair of tools. (default:\n0,140,140,140,140,140,0,140,140,140,140,140,0,140,140,140,140,140,0,140,140,140,140,140,0)"
    },
    "dataType": "string",
    "defaultValue": "0,140,140,140,140,140,0,140,140,140,140,140,0,140,140,140,140,140,0,140,140,140,140,140,0",
    "defaultActiveForSlicing": false
  },
  {
    "key": "z_offset",
    "cliKey": "z-offset",
    "group": "Misc",
    "uiLevel": "mid",
    "label": {
      "cs": "Z Offset",
      "en": "Z Offset"
    },
    "help": {
      "cs": "",
      "en": "This value will be added (or subtracted) from all the Z coordinates in the\noutput G-code. It is used to compensate for bad Z endstop position: for example,\nif your endstop zero actually leaves the nozzle 0.3mm far from the print bed,\nset this to -0.3 (or fix your endstop). (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "bridge_flow_ratio",
    "cliKey": "bridge-flow-ratio",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Bridge Flow Ratio",
      "en": "Bridge Flow Ratio"
    },
    "help": {
      "cs": "",
      "en": "This factor affects the amount of plastic for bridging. You can decrease it\nslightly to pull the extrudates and prevent sagging, although default settings\nare usually good and you should experiment with cooling (use a fan) before\ntweaking this. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "elefant_foot_compensation",
    "cliKey": "elefant-foot-compensation",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Elefant Foot Compensation",
      "en": "Elefant Foot Compensation"
    },
    "help": {
      "cs": "",
      "en": "The first layer will be shrunk in the XY plane by the configured value to\ncompensate for the 1st layer squish aka an Elephant Foot effect. (mm, default:\n0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "infill_anchor",
    "cliKey": "infill-anchor",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Infill Anchor",
      "en": "Infill Anchor"
    },
    "help": {
      "cs": "",
      "en": "Connect an infill line to an internal perimeter with a short segment of an\nadditional perimeter. If expressed as percentage (example: 15%) it is calculated\nover infill extrusion width. PrusaSlicer tries to connect two close infill lines\nto a short perimeter segment. If no such perimeter segment shorter than\ninfill_anchor_max is found, the infill line is connected to a perimeter segment\nat just one side and the length of the perimeter segment taken is limited to\nthis parameter, but no longer than anchor_length_max. Set this parameter to zero\nto disable anchoring perimeters connected to a single infill line. (mm or %,\ndefault: 600%)"
    },
    "dataType": "string",
    "defaultValue": "600%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "infill_anchor_max",
    "cliKey": "infill-anchor-max",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Infill Anchor Max",
      "en": "Infill Anchor Max"
    },
    "help": {
      "cs": "",
      "en": "Connect an infill line to an internal perimeter with a short segment of an\nadditional perimeter. If expressed as percentage (example: 15%) it is calculated\nover infill extrusion width. PrusaSlicer tries to connect two close infill lines\nto a short perimeter segment. If no such perimeter segment shorter than this\nparameter is found, the infill line is connected to a perimeter segment at just\none side and the length of the perimeter segment taken is limited to\ninfill_anchor, but no longer than this parameter. Set this parameter to zero to\ndisable anchoring. (mm or %, default: 50)"
    },
    "dataType": "number",
    "defaultValue": 50,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "infill_overlap",
    "cliKey": "infill-overlap",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Infill Overlap",
      "en": "Infill Overlap"
    },
    "help": {
      "cs": "",
      "en": "This setting applies an additional overlap between infill and perimeters for\nbetter bonding. Theoretically this shouldn't be needed, but backlash might cause\ngaps. If expressed as percentage (example: 15%) it is calculated over perimeter\nextrusion width. (mm or %, default: 25%)"
    },
    "dataType": "string",
    "defaultValue": "25%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "min_bead_width",
    "cliKey": "min-bead-width",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Min Bead Width",
      "en": "Min Bead Width"
    },
    "help": {
      "cs": "",
      "en": "Width of the perimeter that will replace thin features (according to the Minimum\nfeature size) of the model. If the Minimum perimeter width is thinner than the\nthickness of the feature, the perimeter will become as thick as the feature\nitself. If expressed as a percentage (for example 85%), it will be computed\nbased on the nozzle diameter. (mm or %, default: 85%)"
    },
    "dataType": "string",
    "defaultValue": "85%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "min_feature_size",
    "cliKey": "min-feature-size",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Min Feature Size",
      "en": "Min Feature Size"
    },
    "help": {
      "cs": "",
      "en": "Minimum thickness of thin features. Model features that are thinner than this\nvalue will not be printed, while features thicker than the Minimum feature size\nwill be widened to the Minimum perimeter width. If expressed as a percentage\n(for example 25%), it will be computed based on the nozzle diameter. (mm or %,\ndefault: 25%)"
    },
    "dataType": "string",
    "defaultValue": "25%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "mmu_segmented_region_interlocking_depth",
    "cliKey": "mmu-segmented-region-interlocking-depth",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "MMU Segmented Region Interlocking Depth",
      "en": "MMU Segmented Region Interlocking Depth"
    },
    "help": {
      "cs": "",
      "en": "Interlocking depth of a segmented region. It will be ignored if\n\"mmu_segmented_region_max_width\" is zero or if\n\"mmu_segmented_region_interlocking_depth\"is bigger then\n\"mmu_segmented_region_max_width\". Zero disables this feature. (mm (zero to\ndisable), default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false
  },
  {
    "key": "mmu_segmented_region_max_width",
    "cliKey": "mmu-segmented-region-max-width",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "MMU Segmented Region Max Width",
      "en": "MMU Segmented Region Max Width"
    },
    "help": {
      "cs": "",
      "en": "Maximum width of a segmented region. Zero disables this feature. (mm (zero to\ndisable), default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false
  },
  {
    "key": "slice_closing_radius",
    "cliKey": "slice-closing-radius",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Slice Closing Radius",
      "en": "Slice Closing Radius"
    },
    "help": {
      "cs": "",
      "en": "Cracks smaller than 2x gap closing radius are being filled during the triangle\nmesh slicing. The gap closing operation may reduce the final print resolution,\ntherefore it is advisable to keep the value reasonably low. (mm, default: 0.049)"
    },
    "dataType": "number",
    "defaultValue": 0.049,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "slicing_mode",
    "cliKey": "slicing-mode",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Slicing Mode",
      "en": "Slicing Mode"
    },
    "help": {
      "cs": "",
      "en": "Use \"Even-odd\" for 3DLabPrint airplane models. Use \"Close holes\" to close all\nholes in the model. (regular, even_odd, close_holes; default: regular)"
    },
    "dataType": "enum",
    "defaultValue": "regular",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "regular",
        "label": "regular"
      },
      {
        "value": "even_odd",
        "label": "even_odd"
      },
      {
        "value": "close_holes",
        "label": "close_holes"
      }
    ]
  },
  {
    "key": "wall_distribution_count",
    "cliKey": "wall-distribution-count",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Wall Distribution Count",
      "en": "Wall Distribution Count"
    },
    "help": {
      "cs": "",
      "en": "The number of perimeters, counted from the center, over which the variation\nneeds to be spread. Lower values mean that the outer perimeters don't change in\nwidth. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "wall_transition_angle",
    "cliKey": "wall-transition-angle",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Wall Transition Angle",
      "en": "Wall Transition Angle"
    },
    "help": {
      "cs": "",
      "en": "When to create transitions between even and odd numbers of perimeters. A wedge\nshape with an angle greater than this setting will not have transitions and no\nperimeters will be printed in the center to fill the remaining space. Reducing\nthis setting reduces the number and length of these center perimeters, but may\nleave gaps or overextrude. (°, default: 10)"
    },
    "dataType": "number",
    "defaultValue": 10,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "wall_transition_filter_deviation",
    "cliKey": "wall-transition-filter-deviation",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Wall Transition Filter Deviation",
      "en": "Wall Transition Filter Deviation"
    },
    "help": {
      "cs": "",
      "en": "Prevent transitioning back and forth between one extra perimeter and one less.\nThis margin extends the range of extrusion widths which follow to [Minimum\nperimeter width - margin, 2 * Minimum perimeter width + margin]. Increasing this\nmargin reduces the number of transitions, which reduces the number of extrusion\nstarts/stops and travel time. However, large extrusion width variation can lead\nto under- or overextrusion problems. If expressed as a percentage (for example\n25%), it will be computed based on the nozzle diameter. (mm or %, default: 25%)"
    },
    "dataType": "string",
    "defaultValue": "25%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "wall_transition_length",
    "cliKey": "wall-transition-length",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Wall Transition Length",
      "en": "Wall Transition Length"
    },
    "help": {
      "cs": "",
      "en": "When transitioning between different numbers of perimeters as the part becomes\nthinner, a certain amount of space is allotted to split or join the perimeter\nsegments. If expressed as a percentage (for example 100%), it will be computed\nbased on the nozzle diameter. (mm or %, default: 100%)"
    },
    "dataType": "string",
    "defaultValue": "100%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "xy_size_compensation",
    "cliKey": "xy-size-compensation",
    "group": "Advanced",
    "uiLevel": "pro",
    "label": {
      "cs": "Xy Size Compensation",
      "en": "Xy Size Compensation"
    },
    "help": {
      "cs": "",
      "en": "The object will be grown/shrunk in the XY plane by the configured value\n(negative = inwards, positive = outwards). This might be useful for fine-tuning\nhole sizes. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "extruder",
    "cliKey": "extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Extruder",
      "en": "Extruder"
    },
    "help": {
      "cs": "",
      "en": "The extruder to use (unless more specific extruder settings are specified). This\nvalue overrides perimeter and infill extruders, but not the support extruders."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "infill_extruder",
    "cliKey": "infill-extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Infill Extruder",
      "en": "Infill Extruder"
    },
    "help": {
      "cs": "",
      "en": "N The extruder to use when printing infill. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "perimeter_extruder",
    "cliKey": "perimeter-extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Perimeter Extruder",
      "en": "Perimeter Extruder"
    },
    "help": {
      "cs": "",
      "en": "The extruder to use when printing perimeters and brim. First extruder is 1.\n(default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "solid_infill_extruder",
    "cliKey": "solid-infill-extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Infill Extruder",
      "en": "Solid Infill Extruder"
    },
    "help": {
      "cs": "",
      "en": "The extruder to use when printing solid infill. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "support_material_extruder",
    "cliKey": "support-material-extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Extruder",
      "en": "Support Material Extruder"
    },
    "help": {
      "cs": "",
      "en": "The extruder to use when printing support material, raft and skirt (1+, 0 to use\nthe current extruder to minimize tool changes). (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "support_material_interface_extruder",
    "cliKey": "support-material-interface-extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Interface Extruder",
      "en": "Support Material Interface Extruder"
    },
    "help": {
      "cs": "",
      "en": "The extruder to use when printing support material interface (1+, 0 to use the\ncurrent extruder to minimize tool changes). This affects raft too. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "wipe_tower_extruder",
    "cliKey": "wipe-tower-extruder",
    "group": "Extruders",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Tower Extruder",
      "en": "Wipe Tower Extruder"
    },
    "help": {
      "cs": "",
      "en": "The extruder to use when printing perimeter of the wipe tower. Set to 0 to use\nthe one that is available (non-soluble would be preferred). (default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "external_perimeter_extrusion_width",
    "cliKey": "external-perimeter-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "External Perimeter Extrusion Width",
      "en": "External Perimeter Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for external\nperimeters. If left zero, default extrusion width will be used if set, otherwise\n1.125 x nozzle diameter will be used. If expressed as percentage (for example\n200%), it will be computed over layer height. (mm or %, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "extrusion_width",
    "cliKey": "extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "Extrusion Width",
      "en": "Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "N Set this to a non-zero value to allow a manual extrusion width. If left to zero,\nSlic3r derives extrusion widths from the nozzle diameter (see the tooltips for\nperimeter extrusion width, infill extrusion width etc). If expressed as\npercentage (for example: 230%), it will be computed over layer height. (mm or %,\ndefault: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "first_layer_extrusion_width",
    "cliKey": "first-layer-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "First Layer Extrusion Width",
      "en": "First Layer Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for first layer.\nYou can use this to force fatter extrudates for better adhesion. If expressed as\npercentage (for example 120%) it will be computed over first layer height. If\nset to zero, it will use the default extrusion width. (mm or %, default: 200%)"
    },
    "dataType": "string",
    "defaultValue": "200%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "infill_extrusion_width",
    "cliKey": "infill-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "Infill Extrusion Width",
      "en": "Infill Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for infill. If left\nzero, default extrusion width will be used if set, otherwise 1.125 x nozzle\ndiameter will be used. You may want to use fatter extrudates to speed up the\ninfill and make your parts stronger. If expressed as percentage (for example\n90%) it will be computed over layer height. (mm or %, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "perimeter_extrusion_width",
    "cliKey": "perimeter-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "Perimeter Extrusion Width",
      "en": "Perimeter Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for perimeters. You\nmay want to use thinner extrudates to get more accurate surfaces. If left zero,\ndefault extrusion width will be used if set, otherwise 1.125 x nozzle diameter\nwill be used. If expressed as percentage (for example 200%) it will be computed\nover layer height. (mm or %, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "solid_infill_extrusion_width",
    "cliKey": "solid-infill-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Infill Extrusion Width",
      "en": "Solid Infill Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for infill for\nsolid surfaces. If left zero, default extrusion width will be used if set,\notherwise 1.125 x nozzle diameter will be used. If expressed as percentage (for\nexample 90%) it will be computed over layer height. (mm or %, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "support_material_extrusion_width",
    "cliKey": "support-material-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Extrusion Width",
      "en": "Support Material Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for support\nmaterial. If left zero, default extrusion width will be used if set, otherwise\nnozzle diameter will be used. If expressed as percentage (for example 90%) it\nwill be computed over layer height. (mm or %, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "top_infill_extrusion_width",
    "cliKey": "top-infill-extrusion-width",
    "group": "Extrusion Width",
    "uiLevel": "mid",
    "label": {
      "cs": "Top Infill Extrusion Width",
      "en": "Top Infill Extrusion Width"
    },
    "help": {
      "cs": "",
      "en": "Set this to a non-zero value to set a manual extrusion width for infill for top\nsurfaces. You may want to use thinner extrudates to fill all narrow regions and\nget a smoother finish. If left zero, default extrusion width will be used if\nset, otherwise nozzle diameter will be used. If expressed as percentage (for\nexample 90%) it will be computed over layer height. (mm or %, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm or %",
    "step": 1
  },
  {
    "key": "fuzzy_skin",
    "cliKey": "fuzzy-skin",
    "group": "Fuzzy Skin",
    "uiLevel": "mid",
    "label": {
      "cs": "Fuzzy Skin",
      "en": "Fuzzy Skin"
    },
    "help": {
      "cs": "",
      "en": "Fuzzy skin type. (none, external, all; default: none)"
    },
    "dataType": "enum",
    "defaultValue": "none",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "none",
        "label": "none"
      },
      {
        "value": "external",
        "label": "external"
      },
      {
        "value": "all",
        "label": "all"
      }
    ]
  },
  {
    "key": "fuzzy_skin_point_dist",
    "cliKey": "fuzzy-skin-point-dist",
    "group": "Fuzzy Skin",
    "uiLevel": "mid",
    "label": {
      "cs": "Fuzzy Skin Point Dist",
      "en": "Fuzzy Skin Point Dist"
    },
    "help": {
      "cs": "",
      "en": "Perimeters will be split into multiple segments by inserting Fuzzy skin points.\nLowering the Fuzzy skin point distance will increase the number of randomly\noffset points on the perimeter wall. (mm, default: 0.8)"
    },
    "dataType": "number",
    "defaultValue": 0.8,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "fuzzy_skin_thickness",
    "cliKey": "fuzzy-skin-thickness",
    "group": "Fuzzy Skin",
    "uiLevel": "mid",
    "label": {
      "cs": "Fuzzy Skin Thickness",
      "en": "Fuzzy Skin Thickness"
    },
    "help": {
      "cs": "",
      "en": "The maximum distance that each skin point can be offset (both ways), measured\nperpendicular to the perimeter wall. (mm, default: 0.3)"
    },
    "dataType": "number",
    "defaultValue": 0.3,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "bottom_fill_pattern",
    "cliKey": "bottom-fill-pattern",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Bottom Fill Pattern",
      "en": "Bottom Fill Pattern"
    },
    "help": {
      "cs": "",
      "en": ", --external-fill-pattern, --solid-fill-pattern\nFill pattern for bottom infill. This only affects the bottom external visible\nlayer, and not its adjacent solid shells. (rectilinear, monotonic,\nmonotoniclines, alignedrectilinear, concentric, hilbertcurve, archimedeanchords,\noctagramspiral; default: monotonic)"
    },
    "dataType": "enum",
    "defaultValue": "monotonic",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "rectilinear",
        "label": "rectilinear"
      },
      {
        "value": "monotonic",
        "label": "monotonic"
      },
      {
        "value": "monotoniclines",
        "label": "monotoniclines"
      },
      {
        "value": "alignedrectilinear",
        "label": "alignedrectilinear"
      },
      {
        "value": "concentric",
        "label": "concentric"
      },
      {
        "value": "hilbertcurve",
        "label": "hilbertcurve"
      },
      {
        "value": "archimedeanchords",
        "label": "archimedeanchords"
      },
      {
        "value": "octagramspiral",
        "label": "octagramspiral"
      }
    ]
  },
  {
    "key": "bridge_angle",
    "cliKey": "bridge-angle",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Bridge Angle",
      "en": "Bridge Angle"
    },
    "help": {
      "cs": "",
      "en": "Bridging angle override. If left to zero, the bridging angle will be calculated\nautomatically. Otherwise the provided angle will be used for all bridges. Use\n180° for zero angle. (°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "fill_angle",
    "cliKey": "fill-angle",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Fill Angle",
      "en": "Fill Angle"
    },
    "help": {
      "cs": "",
      "en": "Default base angle for infill orientation. Cross-hatching will be applied to\nthis. Bridges will be infilled using the best direction Slic3r can detect, so\nthis setting does not affect them. (°, default: 45)"
    },
    "dataType": "number",
    "defaultValue": 45,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "fill_density",
    "cliKey": "fill-density",
    "group": "Infill",
    "uiLevel": "basic",
    "label": {
      "cs": "Fill Density",
      "en": "Fill Density"
    },
    "help": {
      "cs": "",
      "en": "Density of internal infill, expressed in the range 0% - 100%. (%, default: 20%)"
    },
    "dataType": "string",
    "defaultValue": "20%",
    "defaultActiveForSlicing": true,
    "unit": "%"
  },
  {
    "key": "fill_pattern",
    "cliKey": "fill-pattern",
    "group": "Infill",
    "uiLevel": "basic",
    "label": {
      "cs": "Fill Pattern",
      "en": "Fill Pattern"
    },
    "help": {
      "cs": "",
      "en": "Fill pattern for general low-density infill. (rectilinear, alignedrectilinear,\ngrid, triangles, stars, cubic, line, concentric, honeycomb, 3dhoneycomb, gyroid,\nhilbertcurve, archimedeanchords, octagramspiral, adaptivecubic, supportcubic,\nlightning; default: stars)"
    },
    "dataType": "enum",
    "defaultValue": "stars",
    "defaultActiveForSlicing": true,
    "options": [
      {
        "value": "rectilinear",
        "label": "rectilinear"
      },
      {
        "value": "alignedrectilinear",
        "label": "alignedrectilinear"
      },
      {
        "value": "grid",
        "label": "grid"
      },
      {
        "value": "triangles",
        "label": "triangles"
      },
      {
        "value": "stars",
        "label": "stars"
      },
      {
        "value": "cubic",
        "label": "cubic"
      },
      {
        "value": "line",
        "label": "line"
      },
      {
        "value": "concentric",
        "label": "concentric"
      },
      {
        "value": "honeycomb",
        "label": "honeycomb"
      },
      {
        "value": "3dhoneycomb",
        "label": "3dhoneycomb"
      },
      {
        "value": "gyroid",
        "label": "gyroid"
      },
      {
        "value": "hilbertcurve",
        "label": "hilbertcurve"
      },
      {
        "value": "archimedeanchords",
        "label": "archimedeanchords"
      },
      {
        "value": "octagramspiral",
        "label": "octagramspiral"
      },
      {
        "value": "adaptivecubic",
        "label": "adaptivecubic"
      },
      {
        "value": "supportcubic",
        "label": "supportcubic"
      },
      {
        "value": "lightning",
        "label": "lightning"
      }
    ]
  },
  {
    "key": "infill_every_layers",
    "cliKey": "infill-every-layers",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Infill Every Layers",
      "en": "Infill Every Layers"
    },
    "help": {
      "cs": "",
      "en": "This feature allows to combine infill and speed up your print by extruding\nthicker infill layers while preserving thin perimeters, thus accuracy. (layers,\ndefault: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "unit": "layers",
    "step": 1
  },
  {
    "key": "solid_infill_below_area",
    "cliKey": "solid-infill-below-area",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Infill Below Area",
      "en": "Solid Infill Below Area"
    },
    "help": {
      "cs": "",
      "en": "Force solid infill for regions having a smaller area than the specified\nthreshold. (mm², default: 70)"
    },
    "dataType": "number",
    "defaultValue": 70,
    "defaultActiveForSlicing": false,
    "unit": "mm²",
    "step": 1
  },
  {
    "key": "solid_infill_every_layers",
    "cliKey": "solid-infill-every-layers",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Solid Infill Every Layers",
      "en": "Solid Infill Every Layers"
    },
    "help": {
      "cs": "",
      "en": "This feature allows to force a solid layer every given number of layers. Zero to\ndisable. You can set this to any value (for example 9999); Slic3r will\nautomatically choose the maximum possible number of layers to combine according\nto nozzle diameter and layer height. (layers, default: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "layers"
  },
  {
    "key": "top_fill_pattern",
    "cliKey": "top-fill-pattern",
    "group": "Infill",
    "uiLevel": "mid",
    "label": {
      "cs": "Top Fill Pattern",
      "en": "Top Fill Pattern"
    },
    "help": {
      "cs": "",
      "en": ", --external-fill-pattern, --solid-fill-pattern\nFill pattern for top infill. This only affects the top visible layer, and not\nits adjacent solid shells. (rectilinear, monotonic, monotoniclines,\nalignedrectilinear, concentric, hilbertcurve, archimedeanchords, octagramspiral;\ndefault: monotonic)"
    },
    "dataType": "enum",
    "defaultValue": "monotonic",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "rectilinear",
        "label": "rectilinear"
      },
      {
        "value": "monotonic",
        "label": "monotonic"
      },
      {
        "value": "monotoniclines",
        "label": "monotoniclines"
      },
      {
        "value": "alignedrectilinear",
        "label": "alignedrectilinear"
      },
      {
        "value": "concentric",
        "label": "concentric"
      },
      {
        "value": "hilbertcurve",
        "label": "hilbertcurve"
      },
      {
        "value": "archimedeanchords",
        "label": "archimedeanchords"
      },
      {
        "value": "octagramspiral",
        "label": "octagramspiral"
      }
    ]
  },
  {
    "key": "ironing",
    "cliKey": "ironing",
    "group": "Ironing",
    "uiLevel": "mid",
    "label": {
      "cs": "IRONING",
      "en": "IRONING"
    },
    "help": {
      "cs": "",
      "en": "Enable ironing of the top layers with the hot print head for smooth surface"
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "ironing_flowrate",
    "cliKey": "ironing-flowrate",
    "group": "Ironing",
    "uiLevel": "mid",
    "label": {
      "cs": "IRONING Flowrate",
      "en": "IRONING Flowrate"
    },
    "help": {
      "cs": "",
      "en": "Percent of a flow rate relative to object's normal layer height. (%, default:\n15%)"
    },
    "dataType": "string",
    "defaultValue": "15%",
    "defaultActiveForSlicing": false,
    "unit": "%"
  },
  {
    "key": "ironing_spacing",
    "cliKey": "ironing-spacing",
    "group": "Ironing",
    "uiLevel": "mid",
    "label": {
      "cs": "IRONING Spacing",
      "en": "IRONING Spacing"
    },
    "help": {
      "cs": "",
      "en": "N Distance between ironing lines (mm, default: 0.1)"
    },
    "dataType": "number",
    "defaultValue": 0.1,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "ironing_type",
    "cliKey": "ironing-type",
    "group": "Ironing",
    "uiLevel": "mid",
    "label": {
      "cs": "IRONING Type",
      "en": "IRONING Type"
    },
    "help": {
      "cs": "",
      "en": "Ironing Type (top, topmost, solid; default: top)"
    },
    "dataType": "enum",
    "defaultValue": "top",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "top",
        "label": "top"
      },
      {
        "value": "topmost",
        "label": "topmost"
      },
      {
        "value": "solid",
        "label": "solid"
      }
    ]
  },
  {
    "key": "avoid_crossing_perimeters_max_detour",
    "cliKey": "avoid-crossing-perimeters-max-detour",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Avoid Crossing Perimeters Max Detour",
      "en": "Avoid Crossing Perimeters Max Detour"
    },
    "help": {
      "cs": "",
      "en": "The maximum detour length for avoid crossing perimeters. If the detour is longer\nthan this value, avoid crossing perimeters is not applied for this travel path.\nDetour length could be specified either as an absolute value or as percentage\n(for example 50%) of a direct travel path. (mm or % (zero to disable), default:\n0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false
  },
  {
    "key": "bottom_solid_layers",
    "cliKey": "bottom-solid-layers",
    "group": "Layers and Perimeters",
    "uiLevel": "basic",
    "label": {
      "cs": "Bottom Solid Layers",
      "en": "Bottom Solid Layers"
    },
    "help": {
      "cs": "",
      "en": "Number of solid layers to generate on bottom surfaces. (default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "bottom_solid_min_thickness",
    "cliKey": "bottom-solid-min-thickness",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Bottom Solid Min Thickness",
      "en": "Bottom Solid Min Thickness"
    },
    "help": {
      "cs": "",
      "en": "The number of bottom solid layers is increased above bottom_solid_layers if\nnecessary to satisfy minimum thickness of bottom shell. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "external_perimeters_first",
    "cliKey": "external-perimeters-first",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "External Perimeters First",
      "en": "External Perimeters First"
    },
    "help": {
      "cs": "",
      "en": "Print contour perimeters from the outermost one to the innermost one instead of\nthe default inverse order."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "extra_perimeters",
    "cliKey": "extra-perimeters",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Extra Perimeters",
      "en": "Extra Perimeters"
    },
    "help": {
      "cs": "",
      "en": "Add more perimeters when needed for avoiding gaps in sloping walls. Slic3r keeps\nadding perimeters, until more than 70% of the loop immediately above is\nsupported."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "extra_perimeters_on_overhangs",
    "cliKey": "extra-perimeters-on-overhangs",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Extra Perimeters On Overhangs",
      "en": "Extra Perimeters On Overhangs"
    },
    "help": {
      "cs": "",
      "en": "Detect overhang areas where bridges cannot be anchored, and fill them with extra\nperimeter paths. These paths are anchored to the nearby non-overhang area when\npossible."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "first_layer_height",
    "cliKey": "first-layer-height",
    "group": "Layers and Perimeters",
    "uiLevel": "basic",
    "label": {
      "cs": "First Layer Height",
      "en": "First Layer Height"
    },
    "help": {
      "cs": "",
      "en": "When printing with very low layer heights, you might still want to print a\nthicker bottom layer to improve adhesion and tolerance for non perfect build\nplates. (mm, default: 0.35)"
    },
    "dataType": "number",
    "defaultValue": 0.35,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "gap_fill_enabled",
    "cliKey": "gap-fill-enabled",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Gap Fill Enabled",
      "en": "Gap Fill Enabled"
    },
    "help": {
      "cs": "",
      "en": "Enables filling of gaps between perimeters and between the inner most perimeters\nand infill."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "interface_shells",
    "cliKey": "interface-shells",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Interface Shells",
      "en": "Interface Shells"
    },
    "help": {
      "cs": "",
      "en": "Force the generation of solid shells between adjacent materials/volumes. Useful\nfor multi-extruder prints with translucent materials or manual soluble support\nmaterial."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "layer_height",
    "cliKey": "layer-height",
    "group": "Layers and Perimeters",
    "uiLevel": "basic",
    "label": {
      "cs": "Layer Height",
      "en": "Layer Height"
    },
    "help": {
      "cs": "",
      "en": "This setting controls the height (and thus the total number) of the\nslices/layers. Thinner layers give better accuracy but take more time to print.\n(mm, default: 0.3)"
    },
    "dataType": "number",
    "defaultValue": 0.3,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "overhangs",
    "cliKey": "overhangs",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhangs",
      "en": "Overhangs"
    },
    "help": {
      "cs": "",
      "en": "Experimental option to adjust flow for overhangs (bridge flow will be used), to\napply bridge speed to them and enable fan."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "perimeter_generator",
    "cliKey": "perimeter-generator",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Perimeter Generator",
      "en": "Perimeter Generator"
    },
    "help": {
      "cs": "",
      "en": "Classic perimeter generator produces perimeters with constant extrusion width\nand for very thin areas is used gap-fill. Arachne engine produces perimeters\nwith variable extrusion width. This setting also affects the Concentric infill.\n(classic, arachne; default: arachne)"
    },
    "dataType": "enum",
    "defaultValue": "arachne",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "classic",
        "label": "classic"
      },
      {
        "value": "arachne",
        "label": "arachne"
      }
    ]
  },
  {
    "key": "perimeters",
    "cliKey": "perimeters",
    "group": "Layers and Perimeters",
    "uiLevel": "basic",
    "label": {
      "cs": "Perimeters",
      "en": "Perimeters"
    },
    "help": {
      "cs": "",
      "en": "This option sets the number of perimeters to generate for each layer. Note that\nSlic3r may increase this number automatically when it detects sloping surfaces\nwhich benefit from a higher number of perimeters if the Extra Perimeters option\nis enabled. ((minimum), default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "seam_position",
    "cliKey": "seam-position",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Seam Position",
      "en": "Seam Position"
    },
    "help": {
      "cs": "",
      "en": "Position of perimeters starting points. (random, nearest, aligned, rear;\ndefault: aligned)"
    },
    "dataType": "enum",
    "defaultValue": "aligned",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "random",
        "label": "random"
      },
      {
        "value": "nearest",
        "label": "nearest"
      },
      {
        "value": "aligned",
        "label": "aligned"
      },
      {
        "value": "rear",
        "label": "rear"
      }
    ]
  },
  {
    "key": "thick_bridges",
    "cliKey": "thick-bridges",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Thick Bridges",
      "en": "Thick Bridges"
    },
    "help": {
      "cs": "",
      "en": "If enabled, bridges are more reliable, can bridge longer distances, but may look\nworse. If disabled, bridges look better but are reliable just for shorter\nbridged distances."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "thin_walls",
    "cliKey": "thin-walls",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Thin Walls",
      "en": "Thin Walls"
    },
    "help": {
      "cs": "",
      "en": "Detect single-width walls (parts where two extrusions don't fit and we need to\ncollapse them into a single trace)."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "top_solid_layers",
    "cliKey": "top-solid-layers",
    "group": "Layers and Perimeters",
    "uiLevel": "basic",
    "label": {
      "cs": "Top Solid Layers",
      "en": "Top Solid Layers"
    },
    "help": {
      "cs": "",
      "en": "Number of solid layers to generate on top surfaces. (default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": true,
    "step": 1
  },
  {
    "key": "top_solid_min_thickness",
    "cliKey": "top-solid-min-thickness",
    "group": "Layers and Perimeters",
    "uiLevel": "mid",
    "label": {
      "cs": "Top Solid Min Thickness",
      "en": "Top Solid Min Thickness"
    },
    "help": {
      "cs": "",
      "en": "The number of top solid layers is increased above top_solid_layers if necessary\nto satisfy minimum thickness of top shell. This is useful to prevent pillowing\neffect when printing with variable layer height. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "machine_limits_usage",
    "cliKey": "machine-limits-usage",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Limits Usage",
      "en": "Machine Limits Usage"
    },
    "help": {
      "cs": "",
      "en": "How to apply the Machine Limits (emit_to_gcode, time_estimate_only, ignore;\ndefault: time_estimate_only)"
    },
    "dataType": "enum",
    "defaultValue": "time_estimate_only",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "emit_to_gcode",
        "label": "emit_to_gcode"
      },
      {
        "value": "time_estimate_only",
        "label": "time_estimate_only"
      },
      {
        "value": "ignore",
        "label": "ignore"
      }
    ]
  },
  {
    "key": "machine_max_acceleration_e",
    "cliKey": "machine-max-acceleration-e",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration E",
      "en": "Machine Max Acceleration E"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration of the E axis (mm/s², default: 10000,5000)"
    },
    "dataType": "string",
    "defaultValue": "10000,5000",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_acceleration_extruding",
    "cliKey": "machine-max-acceleration-extruding",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration Extruding",
      "en": "Machine Max Acceleration Extruding"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration when extruding (mm/s², default: 1500,1250)"
    },
    "dataType": "string",
    "defaultValue": "1500,1250",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_acceleration_retracting",
    "cliKey": "machine-max-acceleration-retracting",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration Retracting",
      "en": "Machine Max Acceleration Retracting"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration when retracting. Not used for RepRapFirmware, which does\nnot support it. (mm/s², default: 1500,1250)"
    },
    "dataType": "string",
    "defaultValue": "1500,1250",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_acceleration_travel",
    "cliKey": "machine-max-acceleration-travel",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration Travel",
      "en": "Machine Max Acceleration Travel"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration for travel moves. (mm/s², default: 1500,1250)"
    },
    "dataType": "string",
    "defaultValue": "1500,1250",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_acceleration_x",
    "cliKey": "machine-max-acceleration-x",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration X",
      "en": "Machine Max Acceleration X"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration of the X axis (mm/s², default: 9000,1000)"
    },
    "dataType": "string",
    "defaultValue": "9000,1000",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_acceleration_y",
    "cliKey": "machine-max-acceleration-y",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration Y",
      "en": "Machine Max Acceleration Y"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration of the Y axis (mm/s², default: 9000,1000)"
    },
    "dataType": "string",
    "defaultValue": "9000,1000",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_acceleration_z",
    "cliKey": "machine-max-acceleration-z",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Acceleration Z",
      "en": "Machine Max Acceleration Z"
    },
    "help": {
      "cs": "",
      "en": "Maximum acceleration of the Z axis (mm/s², default: 500,200)"
    },
    "dataType": "string",
    "defaultValue": "500,200",
    "defaultActiveForSlicing": false,
    "unit": "mm/s²"
  },
  {
    "key": "machine_max_feedrate_e",
    "cliKey": "machine-max-feedrate-e",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Feedrate E",
      "en": "Machine Max Feedrate E"
    },
    "help": {
      "cs": "",
      "en": "Maximum feedrate of the E axis (mm/s, default: 120,120)"
    },
    "dataType": "string",
    "defaultValue": "120,120",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_feedrate_x",
    "cliKey": "machine-max-feedrate-x",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Feedrate X",
      "en": "Machine Max Feedrate X"
    },
    "help": {
      "cs": "",
      "en": "Maximum feedrate of the X axis (mm/s, default: 500,200)"
    },
    "dataType": "string",
    "defaultValue": "500,200",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_feedrate_y",
    "cliKey": "machine-max-feedrate-y",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Feedrate Y",
      "en": "Machine Max Feedrate Y"
    },
    "help": {
      "cs": "",
      "en": "Maximum feedrate of the Y axis (mm/s, default: 500,200)"
    },
    "dataType": "string",
    "defaultValue": "500,200",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_feedrate_z",
    "cliKey": "machine-max-feedrate-z",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Feedrate Z",
      "en": "Machine Max Feedrate Z"
    },
    "help": {
      "cs": "",
      "en": "Maximum feedrate of the Z axis (mm/s, default: 12,12)"
    },
    "dataType": "string",
    "defaultValue": "12,12",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_jerk_e",
    "cliKey": "machine-max-jerk-e",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Jerk E",
      "en": "Machine Max Jerk E"
    },
    "help": {
      "cs": "",
      "en": "Maximum jerk of the E axis (mm/s, default: 2.5,2.5)"
    },
    "dataType": "string",
    "defaultValue": "2.5,2.5",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_jerk_x",
    "cliKey": "machine-max-jerk-x",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Jerk X",
      "en": "Machine Max Jerk X"
    },
    "help": {
      "cs": "",
      "en": "Maximum jerk of the X axis (mm/s, default: 10,10)"
    },
    "dataType": "string",
    "defaultValue": "10,10",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_jerk_y",
    "cliKey": "machine-max-jerk-y",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Jerk Y",
      "en": "Machine Max Jerk Y"
    },
    "help": {
      "cs": "",
      "en": "Maximum jerk of the Y axis (mm/s, default: 10,10)"
    },
    "dataType": "string",
    "defaultValue": "10,10",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_max_jerk_z",
    "cliKey": "machine-max-jerk-z",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Max Jerk Z",
      "en": "Machine Max Jerk Z"
    },
    "help": {
      "cs": "",
      "en": "Maximum jerk of the Z axis (mm/s, default: 0.2,0.4)"
    },
    "dataType": "string",
    "defaultValue": "0.2,0.4",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_min_extruding_rate",
    "cliKey": "machine-min-extruding-rate",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Min Extruding Rate",
      "en": "Machine Min Extruding Rate"
    },
    "help": {
      "cs": "",
      "en": "Minimum feedrate when extruding (M205 S) (mm/s, default: 0,0)"
    },
    "dataType": "string",
    "defaultValue": "0,0",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "machine_min_travel_rate",
    "cliKey": "machine-min-travel-rate",
    "group": "Machine limits",
    "uiLevel": "pro",
    "label": {
      "cs": "Machine Min Travel Rate",
      "en": "Machine Min Travel Rate"
    },
    "help": {
      "cs": "",
      "en": "Minimum travel feedrate (M205 T) (mm/s, default: 0,0)"
    },
    "dataType": "string",
    "defaultValue": "0,0",
    "defaultActiveForSlicing": false,
    "unit": "mm/s"
  },
  {
    "key": "brim_separation",
    "cliKey": "brim-separation",
    "group": "Skirt and brim",
    "uiLevel": "mid",
    "label": {
      "cs": "Brim Separation",
      "en": "Brim Separation"
    },
    "help": {
      "cs": "",
      "en": "N Offset of brim from the printed object. The offset is applied after the elephant\nfoot compensation. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "brim_type",
    "cliKey": "brim-type",
    "group": "Skirt and brim",
    "uiLevel": "mid",
    "label": {
      "cs": "Brim Type",
      "en": "Brim Type"
    },
    "help": {
      "cs": "",
      "en": "The places where the brim will be printed around each object on the first layer.\n(no_brim, outer_only, inner_only, outer_and_inner; default: outer_only)"
    },
    "dataType": "enum",
    "defaultValue": "outer_only",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "no_brim",
        "label": "no_brim"
      },
      {
        "value": "outer_only",
        "label": "outer_only"
      },
      {
        "value": "inner_only",
        "label": "inner_only"
      },
      {
        "value": "outer_and_inner",
        "label": "outer_and_inner"
      }
    ]
  },
  {
    "key": "brim_width",
    "cliKey": "brim-width",
    "group": "Skirt and brim",
    "uiLevel": "basic",
    "label": {
      "cs": "Brim Width",
      "en": "Brim Width"
    },
    "help": {
      "cs": "",
      "en": "The horizontal width of the brim that will be printed around each object on the\nfirst layer. When raft is used, no brim is generated (use\nraft_first_layer_expansion). (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "bridge_speed",
    "cliKey": "bridge-speed",
    "group": "Speed",
    "uiLevel": "basic",
    "label": {
      "cs": "Bridge Speed",
      "en": "Bridge Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for printing bridges. (mm/s, default: 60)"
    },
    "dataType": "number",
    "defaultValue": 60,
    "defaultActiveForSlicing": true,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "enable_dynamic_overhang_speeds",
    "cliKey": "enable-dynamic-overhang-speeds",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Enable Dynamic Overhang Speeds",
      "en": "Enable Dynamic Overhang Speeds"
    },
    "help": {
      "cs": "",
      "en": "This setting enables dynamic speed control on overhangs."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "external_perimeter_speed",
    "cliKey": "external-perimeter-speed",
    "group": "Speed",
    "uiLevel": "basic",
    "label": {
      "cs": "External Perimeter Speed",
      "en": "External Perimeter Speed"
    },
    "help": {
      "cs": "",
      "en": "This separate setting will affect the speed of external perimeters (the visible\nones). If expressed as percentage (for example: 80%) it will be calculated on\nthe perimeters speed setting above. Set to zero for auto. (mm/s or %, default:\n50%)"
    },
    "dataType": "string",
    "defaultValue": "50%",
    "defaultActiveForSlicing": true,
    "unit": "mm/s or %"
  },
  {
    "key": "gap_fill_speed",
    "cliKey": "gap-fill-speed",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Gap Fill Speed",
      "en": "Gap Fill Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for filling small gaps using short zigzag moves. Keep this reasonably low\nto avoid too much shaking and resonance issues. Set zero to disable gaps\nfilling. (mm/s, default: 20)"
    },
    "dataType": "number",
    "defaultValue": 20,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "infill_speed",
    "cliKey": "infill-speed",
    "group": "Speed",
    "uiLevel": "basic",
    "label": {
      "cs": "Infill Speed",
      "en": "Infill Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for printing the internal fill. Set to zero for auto. (mm/s, default: 80)"
    },
    "dataType": "number",
    "defaultValue": 80,
    "defaultActiveForSlicing": true,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "ironing_speed",
    "cliKey": "ironing-speed",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "IRONING Speed",
      "en": "IRONING Speed"
    },
    "help": {
      "cs": "",
      "en": "Ironing (mm/s, default: 15)"
    },
    "dataType": "number",
    "defaultValue": 15,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "overhang_speed_0",
    "cliKey": "overhang-speed-0",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Speed 0",
      "en": "Overhang Speed 0"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Speeds for overhang sizes in between\nare calculated via linear interpolation. If set as percentage, the speed is\ncalculated over the external perimeter speed. Note that the speeds generated to\ngcode will never exceed the max volumetric speed value. (mm/s or %, default: 15)"
    },
    "dataType": "number",
    "defaultValue": 15,
    "defaultActiveForSlicing": false,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "overhang_speed_1",
    "cliKey": "overhang-speed-1",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Speed 1",
      "en": "Overhang Speed 1"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Speeds for overhang sizes in between\nare calculated via linear interpolation. If set as percentage, the speed is\ncalculated over the external perimeter speed. Note that the speeds generated to\ngcode will never exceed the max volumetric speed value. (mm/s or %, default: 15)"
    },
    "dataType": "number",
    "defaultValue": 15,
    "defaultActiveForSlicing": false,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "overhang_speed_2",
    "cliKey": "overhang-speed-2",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Speed 2",
      "en": "Overhang Speed 2"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Speeds for overhang sizes in between\nare calculated via linear interpolation. If set as percentage, the speed is\ncalculated over the external perimeter speed. Note that the speeds generated to\ngcode will never exceed the max volumetric speed value. (mm/s or %, default: 20)"
    },
    "dataType": "number",
    "defaultValue": 20,
    "defaultActiveForSlicing": false,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "overhang_speed_3",
    "cliKey": "overhang-speed-3",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Overhang Speed 3",
      "en": "Overhang Speed 3"
    },
    "help": {
      "cs": "",
      "en": "Overhang size is expressed as a percentage of overlap of the extrusion with the\nprevious layer: 100% would be full overlap (no overhang), while 0% represents\nfull overhang (floating extrusion, bridge). Speeds for overhang sizes in between\nare calculated via linear interpolation. If set as percentage, the speed is\ncalculated over the external perimeter speed. Note that the speeds generated to\ngcode will never exceed the max volumetric speed value. (mm/s or %, default: 25)"
    },
    "dataType": "number",
    "defaultValue": 25,
    "defaultActiveForSlicing": false,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "perimeter_speed",
    "cliKey": "perimeter-speed",
    "group": "Speed",
    "uiLevel": "basic",
    "label": {
      "cs": "Perimeter Speed",
      "en": "Perimeter Speed"
    },
    "help": {
      "cs": "",
      "en": "N Speed for perimeters (contours, aka vertical shells). Set to zero for auto.\n(mm/s, default: 60)"
    },
    "dataType": "number",
    "defaultValue": 60,
    "defaultActiveForSlicing": true,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "small_perimeter_speed",
    "cliKey": "small-perimeter-speed",
    "group": "Speed",
    "uiLevel": "mid",
    "label": {
      "cs": "Small Perimeter Speed",
      "en": "Small Perimeter Speed"
    },
    "help": {
      "cs": "",
      "en": "This separate setting will affect the speed of perimeters having radius <= 6.5mm\n(usually holes). If expressed as percentage (for example: 80%) it will be\ncalculated on the perimeters speed setting above. Set to zero for auto. (mm/s or\n%, default: 15)"
    },
    "dataType": "number",
    "defaultValue": 15,
    "defaultActiveForSlicing": false,
    "unit": "mm/s or\n%",
    "step": 1
  },
  {
    "key": "solid_infill_speed",
    "cliKey": "solid-infill-speed",
    "group": "Speed",
    "uiLevel": "basic",
    "label": {
      "cs": "Solid Infill Speed",
      "en": "Solid Infill Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for printing solid regions (top/bottom/internal horizontal shells). This\ncan be expressed as a percentage (for example: 80%) over the default infill\nspeed above. Set to zero for auto. (mm/s or %, default: 20)"
    },
    "dataType": "number",
    "defaultValue": 20,
    "defaultActiveForSlicing": true,
    "unit": "mm/s or %",
    "step": 1
  },
  {
    "key": "top_solid_infill_speed",
    "cliKey": "top-solid-infill-speed",
    "group": "Speed",
    "uiLevel": "basic",
    "label": {
      "cs": "Top Solid Infill Speed",
      "en": "Top Solid Infill Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for printing top solid layers (it only applies to the uppermost external\nlayers and not to their internal solid layers). You may want to slow down this\nto get a nicer surface finish. This can be expressed as a percentage (for\nexample: 80%) over the solid infill speed above. Set to zero for auto. (mm/s or\n%, default: 15)"
    },
    "dataType": "number",
    "defaultValue": 15,
    "defaultActiveForSlicing": true,
    "unit": "mm/s or\n%",
    "step": 1
  },
  {
    "key": "dont_support_bridges",
    "cliKey": "dont-support-bridges",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Dont Support Bridges",
      "en": "Dont Support Bridges"
    },
    "help": {
      "cs": "",
      "en": "Experimental option for preventing support material from being generated under\nbridged areas."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "raft_contact_distance",
    "cliKey": "raft-contact-distance",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Raft Contact Distance",
      "en": "Raft Contact Distance"
    },
    "help": {
      "cs": "",
      "en": "The vertical distance between object and raft. Ignored for soluble interface.\n(mm, default: 0.1)"
    },
    "dataType": "number",
    "defaultValue": 0.1,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "raft_expansion",
    "cliKey": "raft-expansion",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Raft Expansion",
      "en": "Raft Expansion"
    },
    "help": {
      "cs": "",
      "en": "Expansion of the raft in XY plane for better stability. (mm, default: 1.5)"
    },
    "dataType": "number",
    "defaultValue": 1.5,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "raft_first_layer_density",
    "cliKey": "raft-first-layer-density",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Raft First Layer Density",
      "en": "Raft First Layer Density"
    },
    "help": {
      "cs": "",
      "en": "Density of the first raft or support layer. (%, default: 90%)"
    },
    "dataType": "string",
    "defaultValue": "90%",
    "defaultActiveForSlicing": false,
    "unit": "%"
  },
  {
    "key": "raft_first_layer_expansion",
    "cliKey": "raft-first-layer-expansion",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Raft First Layer Expansion",
      "en": "Raft First Layer Expansion"
    },
    "help": {
      "cs": "",
      "en": "Expansion of the first raft or support layer to improve adhesion to print bed.\n(mm, default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "raft_layers",
    "cliKey": "raft-layers",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Raft Layers",
      "en": "Raft Layers"
    },
    "help": {
      "cs": "",
      "en": "The object will be raised by this number of layers, and support material will be\ngenerated under it. (layers, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "unit": "layers",
    "step": 1
  },
  {
    "key": "support_material",
    "cliKey": "support-material",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material",
      "en": "Support Material"
    },
    "help": {
      "cs": "",
      "en": "Enable support material generation."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": true
  },
  {
    "key": "support_material_angle",
    "cliKey": "support-material-angle",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Angle",
      "en": "Support Material Angle"
    },
    "help": {
      "cs": "",
      "en": "Use this setting to rotate the support material pattern on the horizontal plane.\n(°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "support_material_auto",
    "cliKey": "support-material-auto",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Auto",
      "en": "Support Material Auto"
    },
    "help": {
      "cs": "",
      "en": "If checked, supports will be generated automatically based on the overhang\nthreshold value. If unchecked, supports will be generated inside the \"Support\nEnforcer\" volumes only."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": true
  },
  {
    "key": "support_material_bottom_contact_distance",
    "cliKey": "support-material-bottom-contact-distance",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Bottom Contact Distance",
      "en": "Support Material Bottom Contact Distance"
    },
    "help": {
      "cs": "",
      "en": "The vertical distance between the object top surface and the support material\ninterface. If set to zero, support_material_contact_distance will be used for\nboth top and bottom contact Z distances. (mm, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "support_material_bottom_interface_layers",
    "cliKey": "support-material-bottom-interface-layers",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Bottom Interface Layers",
      "en": "Support Material Bottom Interface Layers"
    },
    "help": {
      "cs": "",
      "en": "Number of interface layers to insert between the object(s) and support material.\nSet to -1 to use support_material_interface_layers (layers, default: -1)"
    },
    "dataType": "number",
    "defaultValue": -1,
    "defaultActiveForSlicing": false,
    "unit": "layers",
    "step": 1
  },
  {
    "key": "support_material_buildplate_only",
    "cliKey": "support-material-buildplate-only",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Buildplate Only",
      "en": "Support Material Buildplate Only"
    },
    "help": {
      "cs": "",
      "en": "Only create support if it lies on a build plate. Don't create support on a\nprint."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": true
  },
  {
    "key": "support_material_closing_radius",
    "cliKey": "support-material-closing-radius",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Closing Radius",
      "en": "Support Material Closing Radius"
    },
    "help": {
      "cs": "",
      "en": "For snug supports, the support regions will be merged using morphological\nclosing operation. Gaps smaller than the closing radius will be filled in. (mm,\ndefault: 2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "support_material_contact_distance",
    "cliKey": "support-material-contact-distance",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Contact Distance",
      "en": "Support Material Contact Distance"
    },
    "help": {
      "cs": "",
      "en": "The vertical distance between object and support material interface. Setting\nthis to 0 will also prevent Slic3r from using bridge flow and speed for the\nfirst object layer. (mm, default: 0.2)"
    },
    "dataType": "number",
    "defaultValue": 0.2,
    "defaultActiveForSlicing": true,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "support_material_enforce_layers",
    "cliKey": "support-material-enforce-layers",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Enforce Layers",
      "en": "Support Material Enforce Layers"
    },
    "help": {
      "cs": "",
      "en": "Generate support material for the specified number of layers counting from\nbottom, regardless of whether normal support material is enabled or not and\nregardless of any angle threshold. This is useful for getting more adhesion of\nobjects having a very thin or poor footprint on the build plate. (layers,\ndefault: 0)"
    },
    "dataType": "boolean",
    "defaultValue": false,
    "defaultActiveForSlicing": false,
    "unit": "layers"
  },
  {
    "key": "support_material_interface_contact_loops",
    "cliKey": "support-material-interface-contact-loops",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Interface Contact Loops",
      "en": "Support Material Interface Contact Loops"
    },
    "help": {
      "cs": "",
      "en": "Cover the top contact layer of the supports with loops. Disabled by default."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "support_material_interface_layers",
    "cliKey": "support-material-interface-layers",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Interface Layers",
      "en": "Support Material Interface Layers"
    },
    "help": {
      "cs": "",
      "en": "Number of interface layers to insert between the object(s) and support material.\n(layers, default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": true,
    "unit": "layers",
    "step": 1
  },
  {
    "key": "support_material_interface_pattern",
    "cliKey": "support-material-interface-pattern",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Interface Pattern",
      "en": "Support Material Interface Pattern"
    },
    "help": {
      "cs": "",
      "en": "Pattern used to generate support material interface. Default pattern for\nnon-soluble support interface is Rectilinear, while default pattern for soluble\nsupport interface is Concentric. (auto, rectilinear, concentric; default:\nrectilinear)"
    },
    "dataType": "enum",
    "defaultValue": "rectilinear",
    "defaultActiveForSlicing": true,
    "options": [
      {
        "value": "auto",
        "label": "auto"
      },
      {
        "value": "rectilinear",
        "label": "rectilinear"
      },
      {
        "value": "concentric",
        "label": "concentric"
      }
    ]
  },
  {
    "key": "support_material_interface_spacing",
    "cliKey": "support-material-interface-spacing",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Interface Spacing",
      "en": "Support Material Interface Spacing"
    },
    "help": {
      "cs": "",
      "en": "Spacing between interface lines. Set zero to get a solid interface. (mm,\ndefault: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "support_material_interface_speed",
    "cliKey": "support-material-interface-speed",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Interface Speed",
      "en": "Support Material Interface Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for printing support material interface layers. If expressed as percentage\n(for example 50%) it will be calculated over support material speed. (mm/s or %,\ndefault: 100%)"
    },
    "dataType": "string",
    "defaultValue": "100%",
    "defaultActiveForSlicing": false,
    "unit": "mm/s or %"
  },
  {
    "key": "support_material_pattern",
    "cliKey": "support-material-pattern",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Pattern",
      "en": "Support Material Pattern"
    },
    "help": {
      "cs": "",
      "en": "Pattern used to generate support material. (rectilinear, rectilinear-grid,\nhoneycomb; default: rectilinear)"
    },
    "dataType": "enum",
    "defaultValue": "rectilinear",
    "defaultActiveForSlicing": true,
    "options": [
      {
        "value": "rectilinear",
        "label": "rectilinear"
      },
      {
        "value": "rectilinear-grid",
        "label": "rectilinear-grid"
      },
      {
        "value": "honeycomb",
        "label": "honeycomb"
      }
    ]
  },
  {
    "key": "support_material_spacing",
    "cliKey": "support-material-spacing",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Spacing",
      "en": "Support Material Spacing"
    },
    "help": {
      "cs": "",
      "en": "Spacing between support material lines. (mm, default: 2.5)"
    },
    "dataType": "number",
    "defaultValue": 2.5,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "support_material_speed",
    "cliKey": "support-material-speed",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Speed",
      "en": "Support Material Speed"
    },
    "help": {
      "cs": "",
      "en": "Speed for printing support material. (mm/s, default: 60)"
    },
    "dataType": "number",
    "defaultValue": 60,
    "defaultActiveForSlicing": false,
    "unit": "mm/s",
    "step": 1
  },
  {
    "key": "support_material_style",
    "cliKey": "support-material-style",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Style",
      "en": "Support Material Style"
    },
    "help": {
      "cs": "",
      "en": "Style and shape of the support towers. Projecting the supports into a regular\ngrid will create more stable supports, while snug support towers will save\nmaterial and reduce object scarring. (grid, snug, organic; default: grid)"
    },
    "dataType": "enum",
    "defaultValue": "grid",
    "defaultActiveForSlicing": false,
    "options": [
      {
        "value": "grid",
        "label": "grid"
      },
      {
        "value": "snug",
        "label": "snug"
      },
      {
        "value": "organic",
        "label": "organic"
      }
    ]
  },
  {
    "key": "support_material_synchronize_layers",
    "cliKey": "support-material-synchronize-layers",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Synchronize Layers",
      "en": "Support Material Synchronize Layers"
    },
    "help": {
      "cs": "",
      "en": "Synchronize support layers with the object print layers. This is useful with\nmulti-material printers, where the extruder switch is expensive. This option is\nonly available when top contact Z distance is set to zero."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "support_material_threshold",
    "cliKey": "support-material-threshold",
    "group": "Support material",
    "uiLevel": "basic",
    "label": {
      "cs": "Support Material Threshold",
      "en": "Support Material Threshold"
    },
    "help": {
      "cs": "",
      "en": "Support material will not be generated for overhangs whose slope angle (90° =\nvertical) is above the given threshold. In other words, this value represent the\nmost horizontal slope (measured from the horizontal plane) that you can print\nwithout support material. Set to zero for automatic detection (recommended).\n(°, default: 0)"
    },
    "dataType": "number",
    "defaultValue": 0,
    "defaultActiveForSlicing": true,
    "unit": "°",
    "step": 1
  },
  {
    "key": "support_material_with_sheath",
    "cliKey": "support-material-with-sheath",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material With Sheath",
      "en": "Support Material With Sheath"
    },
    "help": {
      "cs": "",
      "en": "Add a sheath (a single perimeter line) around the base support. This makes the\nsupport more reliable, but also more difficult to remove."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "support_material_xy_spacing",
    "cliKey": "support-material-xy-spacing",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Material Xy Spacing",
      "en": "Support Material Xy Spacing"
    },
    "help": {
      "cs": "",
      "en": "XY separation between an object and its support. If expressed as percentage (for\nexample 50%), it will be calculated over external perimeter width. (mm or %,\ndefault: 50%)"
    },
    "dataType": "string",
    "defaultValue": "50%",
    "defaultActiveForSlicing": false,
    "unit": "mm or %"
  },
  {
    "key": "support_tree_angle",
    "cliKey": "support-tree-angle",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Angle",
      "en": "Support Tree Angle"
    },
    "help": {
      "cs": "",
      "en": "The maximum angle of the branches, when the branches have to avoid the model.\nUse a lower angle to make them more vertical and more stable. Use a higher angle\nto be able to have more reach. (°, default: 40)"
    },
    "dataType": "number",
    "defaultValue": 40,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "support_tree_angle_slow",
    "cliKey": "support-tree-angle-slow",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Angle Slow",
      "en": "Support Tree Angle Slow"
    },
    "help": {
      "cs": "",
      "en": "The preferred angle of the branches, when they do not have to avoid the model.\nUse a lower angle to make them more vertical and more stable. Use a higher angle\nfor branches to merge faster. (°, default: 25)"
    },
    "dataType": "number",
    "defaultValue": 25,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "support_tree_branch_diameter",
    "cliKey": "support-tree-branch-diameter",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Branch Diameter",
      "en": "Support Tree Branch Diameter"
    },
    "help": {
      "cs": "",
      "en": "The diameter of the thinnest branches of organic support. Thicker branches are\nmore sturdy. Branches towards the base will be thicker than this. (mm, default:\n2)"
    },
    "dataType": "number",
    "defaultValue": 2,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "support_tree_branch_diameter_angle",
    "cliKey": "support-tree-branch-diameter-angle",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Branch Diameter Angle",
      "en": "Support Tree Branch Diameter Angle"
    },
    "help": {
      "cs": "",
      "en": "The angle of the branches' diameter as they gradually become thicker towards the\nbottom. An angle of 0 will cause the branches to have uniform thickness over\ntheir length. A bit of an angle can increase stability of the organic support.\n(°, default: 5)"
    },
    "dataType": "number",
    "defaultValue": 5,
    "defaultActiveForSlicing": false,
    "unit": "°",
    "step": 1
  },
  {
    "key": "support_tree_branch_diameter_double_wall",
    "cliKey": "support-tree-branch-diameter-double-wall",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Branch Diameter Double Wall",
      "en": "Support Tree Branch Diameter Double Wall"
    },
    "help": {
      "cs": "",
      "en": "Branches with area larger than the area of a circle of this diameter will be\nprinted with double walls for stability. Set this value to zero for no double\nwalls. (mm, default: 3)"
    },
    "dataType": "number",
    "defaultValue": 3,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 1
  },
  {
    "key": "support_tree_branch_distance",
    "cliKey": "support-tree-branch-distance",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Branch Distance",
      "en": "Support Tree Branch Distance"
    },
    "help": {
      "cs": "",
      "en": "How far apart the branches need to be when they touch the model. Making this\ndistance small will cause the tree support to touch the model at more points,\ncausing better overhang but making support harder to remove. (default: 1)"
    },
    "dataType": "number",
    "defaultValue": 1,
    "defaultActiveForSlicing": false,
    "step": 1
  },
  {
    "key": "support_tree_tip_diameter",
    "cliKey": "support-tree-tip-diameter",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Tip Diameter",
      "en": "Support Tree Tip Diameter"
    },
    "help": {
      "cs": "",
      "en": "Branch tip diameter for organic supports. (mm, default: 0.8)"
    },
    "dataType": "number",
    "defaultValue": 0.8,
    "defaultActiveForSlicing": false,
    "unit": "mm",
    "step": 0.01
  },
  {
    "key": "support_tree_top_rate",
    "cliKey": "support-tree-top-rate",
    "group": "Support material",
    "uiLevel": "mid",
    "label": {
      "cs": "Support Tree Top Rate",
      "en": "Support Tree Top Rate"
    },
    "help": {
      "cs": "",
      "en": "Adjusts the density of the support structure used to generate the tips of the\nbranches. A higher value results in better overhangs but the supports are harder\nto remove, thus it is recommended to enable top support interfaces instead of a\nhigh branch density value if dense interfaces are needed. (%, default: 15%)"
    },
    "dataType": "string",
    "defaultValue": "15%",
    "defaultActiveForSlicing": false,
    "unit": "%"
  },
  {
    "key": "wipe_into_infill",
    "cliKey": "wipe-into-infill",
    "group": "Wipe options",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Into Infill",
      "en": "Wipe Into Infill"
    },
    "help": {
      "cs": "",
      "en": "Purging after toolchange will be done inside this object's infills. This lowers\nthe amount of waste but may result in longer print time due to additional travel\nmoves."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  },
  {
    "key": "wipe_into_objects",
    "cliKey": "wipe-into-objects",
    "group": "Wipe options",
    "uiLevel": "mid",
    "label": {
      "cs": "Wipe Into Objects",
      "en": "Wipe Into Objects"
    },
    "help": {
      "cs": "",
      "en": "Object will be used to purge the nozzle after a toolchange to save material that\nwould otherwise end up in the wipe tower and decrease print time. Colours of the\nobjects will be mixed as a result."
    },
    "dataType": "string",
    "defaultValue": null,
    "defaultActiveForSlicing": false
  }
];
