let port;
let reader;
let device_connected = false;
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder("utf-8");

async function connectToDevice() {
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
        readFromDevice();
    } catch (error) {
        const notFoundText = "NotFoundError: No port selected by the user.";
        const userCancelledConnecting = String(error) === notFoundText;
        if (!userCancelledConnecting) {
            alert("Could not connect to serial device.")
        }
    }
}

async function readFromDevice() {
    while (port.readable && device_connected) {
        reader = port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                let decoded = new TextDecoder().decode(value);
                decoded = decoded.replace(/\n/g, "\r\n");
                term.write(decoded);
            }
        } catch (error) {
            disconnectFromDevice();
            console.error(error);
        } finally {
            reader.releaseLock();
        }
    }
    await port.close();
}

async function writeToDevice(input) {
    let cr = flags.get("carriage-return-checkbox") ? "\r" : "";
    let nl = flags.get("newline-select") ? "\n" : "";
    const payload = `${input}${cr}${nl}`

    if (port.writable) {
        const writer = port.writable.getWriter();
        try {
            await writer.write(encoder.encode(payload));
        } catch (error) {
            console.error(error);
        } finally {
            writer.releaseLock();
        }
    }
}

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