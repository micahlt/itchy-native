const extraKeys = [
  {
    label: "Up Arrow",
    value: "ArrowUp",
  },
  {
    label: "Down Arrow",
    value: "ArrowDown",
  },
  {
    label: "Left Arrow",
    value: "ArrowLeft",
  },
  {
    label: "Right Arrow",
    value: "ArrowRight",
  },
  {
    label: "Spacebar",
    value: " ",
  },
  {
    label: "Enter",
    value: "Enter",
  },
  {
    label: "Escape",
    value: "Escape",
  },
  {
    label: "Backspace",
    value: "Backspace",
  },
  {
    label: "Delete",
    value: "Delete",
  },
  {
    label: "Control",
    value: "Control",
  },
  {
    label: "Shift",
    value: "Shift",
  },
  {
    label: "Alt",
    value: "Alt",
  },
  {
    label: "Caps Lock",
    value: "CapsLock",
  },
  {
    label: "Scroll Lock",
    value: "ScrollLock",
  },
  {
    label: "Insert",
    value: "Insert",
  },
  {
    label: "Home",
    value: "Home",
  },
  {
    label: "End",
    value: "End",
  },
  {
    label: "Page Up",
    value: "PageUp",
  },
  {
    label: "Page Down",
    value: "PageDown",
  },
];

const caps = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  ",",
];

export default function getControlOptions() {
  return [...caps.map((key) => ({ label: key, value: key })), ...extraKeys];
}

export function controlOptionToShortName(key = "") {
  const shortNames: { [key: string]: string } = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    " ": "␣",
    Enter: "Etr",
    Escape: "Esc",
    Backspace: "Bksp",
    Delete: "Del",
    Control: "Ctl",
    Shift: "Shft",
    Alt: "Alt",
    CapsLock: "Cps",
    ScrollLock: "Scrl",
    Insert: "Ins",
    Home: "Hme",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn",
  };
  return shortNames[key] || key.toUpperCase();
}

export function controlOptionToFullName(key = "") {
  const fullNames: { [key: string]: string } = {
    ArrowUp: "Up Arrow",
    ArrowDown: "Down Arrow",
    ArrowLeft: "Left Arrow",
    ArrowRight: "Right Arrow",
    " ": "Spacebar",
    Enter: "Enter",
    Escape: "Escape",
    Backspace: "Backspace",
    Delete: "Delete",
    Control: "Control",
    Shift: "Shift",
    Alt: "Alt",
    CapsLock: "Caps Lock",
    ScrollLock: "Scroll Lock",
    Insert: "Insert",
    Home: "Home",
    End: "End",
    PageUp: "Page Up",
    PageDown: "Page Down",
  };
  return fullNames[key] || key.toUpperCase();
}
