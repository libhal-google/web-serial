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
  fontSize: 18,
});

term.open(document.getElementById('terminal'));
const fit_addon = new FitAddon.FitAddon();
term.loadAddon(fit_addon);
term.loadAddon(new WebLinksAddon.WebLinksAddon());
fit_addon.fit();

input = "";
term.onData(function (data, ev) {
  switch (data) {
    case "\r":
      writeToDevice();
      term.write("\r\n");
      break;
    case "\x7f":
      handleBackspace();
      break;
    // Ignore arrow keys
    case "\x1b":
    case "\x1b[A":
    case "\x1b[B":
    case "\x1b[C":
    case "\x1b[D":
      break;
    default:
      input += data;
      term.write(data);
      break;
  }
});

function handleBackspace() {
  input = input.slice(0, -2);
  term.write("\b \b");
}

async function writeToDevice() {
  let cr = flags.get("carriage-return-select") ? "\r" : "";
  let nl = flags.get("newline-select") ? "\n" : "";
  let payload = `${input}${cr}${nl}`
  if (port) {
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode(payload));
    writer.releaseLock();
  }
  input = "";
}
