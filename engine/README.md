# Gameify Engine
This is a browser-based game engine built on top of the Gameify game library.


## Engine Dev Notes

Objects and HTML elements have custom, engine-only properties in the form of `object.__engine_property`.
When setting custom properties for anything, please follow this convention, and update this document.

The current properties are:

**For Gameify Objects (`object.__engine_property`)**
- `__engine_name`: The type and name of the object, which should be unique. A string formattes like `Type::Name`, eg `Tilemap::Level One`.
- `__engine_visible`: If the object should be shown in the visual editor (eg, which tilemaps are shown while editing another map). This is not universally obyed, but really should be.
- `__engine_options_open`: Set to true when the object's details pane in the sidebar is open. This is set so the sidebar does not jump around when it is refreshed. This is not a way to open or close the details pane, and generally should be used as read-only.
- `__engine_locked`: When set to true, resricts modification of the object, including that it cannot be deleted or renamed. Not actually used anywhere, but the existing functionality has been kept in.
- `__engine_editing`: Set to true when the object is being edited using the visual editor


**For HTML Elements (`element.__engine_property`)**
- `__engine_menu`: An object containing custom context menu items. `{'Context Item': () => {/* Callback */}, ... }`. If an HTML element with this property set is right-clicked, a custom context menu with the specified options is opened.