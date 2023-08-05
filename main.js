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

//===================================
//  GLOBALS
//===================================
let device_connected = false;
let history_position = 0;
let command_history = [];
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder("utf-8");
const flags = new Flags();
const change_event = new Event("change");
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base"
});

//===================================
//  Web Serial
//===================================
let reader;
let port;

function disconnectFromDevice() {
  device_connected = false;
  if (reader && reader.cancel) {
    reader.cancel();
  }
  $("#connect-btn").removeClass("orange-btn").text("Connect");
  $("#baudrate").prop("disabled", false);
  $("#dtr-checkbox").prop("disabled", true);
  $("#rts-checkbox").prop("disabled", true);
  $("#dtr-checkbox").prop("checked", false);
  $("#rts-checkbox").prop("checked", false);
}

async function readFromDevice(port) {
  while (port.readable && device_connected) {
    reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // reader.cancel() has been called.
          break;
        }
        // value is a Uint8Array.
        let decoded = new TextDecoder().decode(value);
        decoded = decoded.replace(/\n/g, "\r\n");
        term.write(decoded);
      }
    } catch (error) {
      disconnectFromDevice();
      const red = '\x1b[31m';
      const resetColor = '\x1b[0m';
      term.write(red + "Exiting serial monitor due to error: " + error + resetColor);
    } finally {
      // Allow the serial port to be closed later.
      reader.releaseLock();
    }
  }
  await port.close();
}

document.querySelector("#connect-btn").addEventListener("click", async () => {
  if (device_connected) {
    disconnectFromDevice();
    return;
  } else {
    try {
      port = await navigator.serial.requestPort();
      const baudRate = Number($("#baudrate").val());
      await port.open({ baudRate });
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      device_connected = true;
      $("#connect-btn").addClass("orange-btn").text("Disconnect");
      $("#baudrate").prop("disabled", true);
      $("#dtr-checkbox").prop("disabled", false);
      $("#rts-checkbox").prop("disabled", false);
      readFromDevice(port);
    } catch (error) {
      const notFoundText = "NotFoundError: No port selected by the user.";
      const userCancelledConnecting = String(error) === notFoundText;
      if (!userCancelledConnecting) {
        alert("Could not connect to serial device.")
      }
    }
  }
});


document.querySelector("#dtr-checkbox").addEventListener("click", async () => {
  let dataTerminalReady = !!document.querySelector("#dtr-checkbox").checked;
  await port.setSignals({ dataTerminalReady });
});

document.querySelector("#rts-checkbox").addEventListener("click", async () => {
  let requestToSend = !!document.querySelector("#rts-checkbox").checked;
  await port.setSignals({ requestToSend });
});

document.querySelector("#serial-input").addEventListener("keyup", event => {
  const DOWN_ARROW = 38;
  const UP_ARROW = 40;
  const ENTER_KEY = 13;

  let count_change_flag = true;

  switch (event.which) {
    case UP_ARROW:
      if (history_position > 0) {
        history_position--;
      }
      break;
    case DOWN_ARROW:
      if (history_position < command_history.length) {
        history_position++;
      }
      break;
    case ENTER_KEY:
      $("#send-btn").click();
      break;
    default:
      count_change_flag = false;
      break;
  }
  if (count_change_flag) {
    let command = command_history[command_history.length - history_position];
    if (command) {
      document.querySelector("#serial-input").value = command;
    }
  }
});

document.querySelector("#send-btn").addEventListener("click", async () => {
  let serial_input = $("#serial-input").val();
  $("#serial-input").val("");
  if (serial_input !== command_history[command_history.length - 1]) {
    command_history.push(serial_input);
  }
  history_position = 0;

  let cr = flags.get("carriage-return-checkbox") ? "\r" : "";
  let nl = flags.get("newline-select") ? "\n" : "";
  payload = `${serial_input}${cr}${nl}`

  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();
  await writer.write(encoder.encode(payload));
  writer.releaseLock();
});

document.querySelector("#clear-btn").addEventListener("click", () => {
  // [0m = Reset color codes
  // [3J = Remove terminal buffer
  // [2J = Clear screen
  // [H  = Return to home (0,0)
  term.write("\x1b[0m\x1b[3J\x1b[2J\x1b[H");
});

document.querySelector("#clear-history-btn").addEventListener("click", () => {
  flags.set("command-history", []);
  options_dialog.close();
});

document.querySelector("#serial-upload").addEventListener("click", () => {
  let serial_file = document.querySelector("#serial-file").files;
  if (!device_connected) {
    alert("Please connect a device before uploading a file.");
    return;
  } else if (serial_file.length === 0) {
    alert("No file selected");
    console.debug("No file");
    return;
  }

  let file = serial_file.item(0);
  let reader = new FileReader();

  // This event listener will be fired once reader.readAsText() finishes
  reader.onload = async () => {
    const writer = port.writable.getWriter();
    await writer.write(reader.result);
    writer.releaseLock();
  };
  reader.readAsArrayBuffer(file);
});

function generateCommandListHtml(command_list) {
  if (!command_list) {
    return "";
  }

  let html = "";
  for (let command of command_list) {
    html += `<option value="${command}" />`;
  }
  return html;
}

flags.attach("baudrate", "change", "38400");
flags.attach("carriage-return-checkbox", "change");
flags.attach("newline-select", "change", true);
flags.bind("command-history", (command_list) => {
  document.querySelector("#command-history").innerHTML = generateCommandListHtml(command_list);
  console.debug("Command history updated");
}, []);


function main() {
  flags.initialize();
}

$(document).on('click', '.browse', function () {
  var file = $(this).parent().parent().parent().find('.file');
  file.trigger('click');
});
$(document).on('change', '.file', function () {
  $(this).parent().find('.form-control')
    .val($(this).val().replace(/C:\\fakepath\\/i, ''));
});

window.onbeforeunload = () => {
  let command_history = flags.get("command-history");
  if (command_history) {
    flags.set("command-history", command_history.slice(0, 99));
  }
  flags.teardown();
  return null;
};

window.addEventListener("resize", () => {
  fit_addon.fit();
});

// Entry point of software start
window.addEventListener("load", main);
