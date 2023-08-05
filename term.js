// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


let term = new Terminal({
  fontFamily: "Andale Mono, courier-new, courier, monospace",
  scrollback: 1024 * 100,
  cursorBlink: true,
  tabStopWidth: 1,
  lineHeight: 1,
  fontSize: 20,
  theme: {
    cursor: "lime",
    cursorAccent: "lime",
    selectionForeground: "lime",
    green: "lime",
  }
});

term.open(document.getElementById('terminal'));
const fit_addon = new FitAddon.FitAddon();
term.loadAddon(fit_addon);
term.loadAddon(new WebLinksAddon.WebLinksAddon());
fit_addon.fit();

window.addEventListener("resize", () => {
  fit_addon.fit();
});

input = "";
term.onData(function (data) {
  const ENTER = "\r";
  const BACKSPACE = "\x7f";
  const UP = "\x1b[A";
  const DOWN = "\x1b[B";
  const LEFT = "\x1b[D";
  const RIGHT = "\x1b[C";

  switch (data) {
    case ENTER:
      handleSubmit();
      term.write("\r\n");
      break;
    case BACKSPACE:
      handleDelete();
      break;
    case UP:
    case DOWN:
    case LEFT:
    case RIGHT:
      break; // TODO: Handle arrow keys like #serial-input
    default:
      input += data;
      term.write('\x1b[32m' + data + '\x1b[0m');
      break;
  }
});

function clearTerminal() {
  term.clear();
}

function handleDelete() {
  input = input.slice(0, -1);
  term.write("\b \b");
}

async function handleSubmit() {
  await writeToDevice(input);
  input = "";
}
