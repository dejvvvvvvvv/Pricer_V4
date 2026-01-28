import React from "react";

import AppIcon from "../AppIcon";

// Backward-compatible alias. Some modules import Icon from "components/ui/Icon".

export default function Icon(props) {
  return <AppIcon {...props} />;
}
