// src/build-info.ts — Build-time metadata injected by the release workflow.
// When running from source, these are the default dev values.
// The release workflow overwrites this file before compiling the binary.

export const APP_VERSION = "dev";
export const APP_AUTHOR = "Arne Brune Olsen";
export const BUILD_DATE = "source";
