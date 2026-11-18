// Request form: re-checks the slot through GET /getCheckSlot right before the form is sent.
// The server checks again when the form is received, so the page still works without this file.

var form = document.getElementById('request-form');

if (form) {
    var alertBox = document.getElementById('request-alert');
    var sending = false;

    form.addEventListener('submit', function (event) {
        if (sending) {
            return;
        }

        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        var slotId = form.getAttribute('data-slot');

        fetch('/getCheckSlot?slotId=' + encodeURIComponent(slotId))
            .then(function (response) {
                return response.json();
            })
            .then(function (result) {
                if (result && result.available === false) {
                    // Take the student to the "just taken" page and keep what they typed.
                    var data = new URLSearchParams({
                        slot: slotId,
                        subject: form.elements.subject.value.trim(),
                        topic: form.elements.topic.value.trim(),
                        description: form.elements.description.value.trim().slice(0, 1000)
                    });
                    window.location.href = '/student/booking-conflict?' + data.toString();
                    return;
                }
                sending = true;
                form.submit();
            })
            .catch(function () {
                // If the check cannot run, send the form anyway; the server makes the final check.
                sending = true;
                form.submit();
            });
    });
}