// Availability manager helpers (faculty/availability and faculty/slot-form).
// The forms save without this file. It only adds:
//   - "+ Interval", "Remove" and "Copy to..." on the weekly hours
//   - the add-slot dialog
//   - end time = start time + 30 minutes in slot forms
// Everything is wrapped in a function so its variables do not clash with app.js.

(function () {

    function pad(number) {
        return String(number).padStart(2, '0');
    }

    function addMinutes(hhmm, minutes) {
        var parts = hhmm.split(':');
        var total = (Number(parts[0]) * 60 + Number(parts[1]) + minutes) % (24 * 60);
        return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
    }

    // Buttons that only work with JavaScript start hidden in the page; show them now.
    document.querySelectorAll('[data-js-only]').forEach(function (element) {
        element.hidden = false;
    });

    // ---------- End time follows the start time in slot forms ----------
    document.querySelectorAll('form[data-auto-end]').forEach(function (slotForm) {
        var start = slotForm.elements.start;
        var end = slotForm.elements.end;

        if (!start || !end) {
            return;
        }

        start.addEventListener('change', function () {
            if (/^([01]\d|2[0-3]):[0-5]\d$/.test(start.value)) {
                end.value = addMinutes(start.value, 30);
            }
        });
    });

    // ---------- Add-slot dialog ----------
    var dialog = document.getElementById('add-slot-dialog');

    if (dialog && typeof dialog.showModal === 'function') {
        var openDialog = function () {
            if (dialog.open) {
                dialog.close();
            }
            dialog.showModal();
        };

        // The server renders it open for ?add=1 and after a failed save; make it a real modal.
        if (dialog.hasAttribute('open')) {
            openDialog();
        }

        document.querySelectorAll('[data-open-dialog]').forEach(function (opener) {
            opener.addEventListener('click', function (event) {
                event.preventDefault();
                openDialog();
            });
        });

        dialog.querySelectorAll('[data-close-dialog]').forEach(function (closer) {
            closer.addEventListener('click', function (event) {
                event.preventDefault();
                dialog.close();
            });
        });

        // A click on the dimmed area outside the panel closes it.
        dialog.addEventListener('click', function (event) {
            if (event.target !== dialog) {
                return;
            }
            var box = dialog.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
                dialog.close();
            }
        });
    }

    // ---------- Weekly hours ----------
    var scheduleForm = document.getElementById('schedule-form');
    var template = document.getElementById('interval-template');

    if (!scheduleForm || !template) {
        return;
    }

    function dayRows(day) {
        return day.querySelectorAll('.schedule-interval');
    }

    function allDays() {
        return Array.prototype.slice.call(scheduleForm.querySelectorAll('.schedule-day'));
    }

    function dayOf(element) {
        return element.closest('.schedule-day');
    }

    // Keep the hidden labels ("Monday start 2") in step with the row order.
    function relabel(day) {
        var name = day.getAttribute('data-name');

        dayRows(day).forEach(function (row, position) {
            var labels = row.querySelectorAll('.time-field > span');
            var remove = row.querySelector('[data-action="remove-interval"]');

            labels[0].textContent = name + ' start ' + (position + 1);
            labels[1].textContent = name + ' end ' + (position + 1);
            if (remove) {
                remove.setAttribute('aria-label', 'Remove ' + name + ' interval ' + (position + 1));
            }
        });
    }

    // Adds one more time range to a day. Indexes only need to be unique: the server reads them in numeric order.
    function addInterval(day, start, end) {
        var highest = -1;

        dayRows(day).forEach(function (row) {
            highest = Math.max(highest, Number(row.getAttribute('data-interval')));
        });

        var html = template.innerHTML
            .replace(/__DAYNAME__/g, day.getAttribute('data-name'))
            .replace(/__DAY__/g, day.getAttribute('data-day'))
            .replace(/__N__/g, String(highest + 1))
            .replace(/__NUM__/g, String(dayRows(day).length + 1))
            .replace(/__START__/g, start)
            .replace(/__END__/g, end);

        var drawer = day.querySelector('.inline-copy-drawer');
        if (drawer) {
            drawer.insertAdjacentHTML('beforebegin', html);
        } else {
            day.querySelector('.schedule-intervals').insertAdjacentHTML('beforeend', html);
        }

        relabel(day);
    }

    function readIntervals(day) {
        return Array.prototype.map.call(dayRows(day), function (row) {
            var inputs = row.querySelectorAll('input[type="time"]');
            return { start: inputs[0].value, end: inputs[1].value };
        });
    }

    // Replaces a day's time ranges with the given list (the first row is kept, it holds the buttons).
    function setIntervals(day, list) {
        var rows = dayRows(day);

        for (var i = rows.length - 1; i > 0; i--) {
            rows[i].remove();
        }

        var inputs = rows[0].querySelectorAll('input[type="time"]');
        inputs[0].value = list[0].start;
        inputs[1].value = list[0].end;

        for (var j = 1; j < list.length; j++) {
            addInterval(day, list[j].start, list[j].end);
        }

        relabel(day);
    }

    function closeDrawers() {
        scheduleForm.querySelectorAll('.inline-copy-drawer').forEach(function (drawer) {
            var toggle = dayOf(drawer).querySelector('[data-action="toggle-copy"]');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.classList.remove('active');
            }
            drawer.remove();
        });
    }

    function button(label, className, action) {
        var element = document.createElement('button');
        element.type = 'button';
        element.className = className;
        element.textContent = label;
        element.setAttribute('data-copy-action', action);
        return element;
    }

    // "Copy to..." drawer: choose the other days, then Apply. Checkboxes here have no name, so they are never submitted.
    function openCopyDrawer(day, toggle) {
        closeDrawers();

        var name = day.getAttribute('data-name');
        var drawer = document.createElement('div');
        drawer.className = 'inline-copy-drawer';
        drawer.setAttribute('role', 'region');
        drawer.setAttribute('aria-label', 'Copy ' + name + ' hours to other days');

        var prompt = document.createElement('span');
        prompt.className = 'copy-prompt';
        prompt.textContent = 'Copy ' + name + ' to:';
        drawer.appendChild(prompt);

        var pills = document.createElement('div');
        pills.className = 'copy-target-pills';
        pills.setAttribute('role', 'group');
        pills.setAttribute('aria-label', 'Destination days');

        allDays().forEach(function (other) {
            if (other === day) {
                return;
            }
            var label = document.createElement('label');
            var checkbox = document.createElement('input');
            label.title = other.getAttribute('data-name');
            checkbox.type = 'checkbox';
            checkbox.value = other.getAttribute('data-day');
            checkbox.setAttribute('aria-label', 'Copy to ' + other.getAttribute('data-name'));
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + other.getAttribute('data-name').slice(0, 3)));
            pills.appendChild(label);
        });
        drawer.appendChild(pills);

        var actions = document.createElement('div');
        actions.className = 'copy-drawer-actions';
        var apply = button('Apply', 'btn small primary', 'apply');
        apply.disabled = true;
        actions.appendChild(apply);
        actions.appendChild(button('All weekdays', 'btn small', 'all'));
        actions.appendChild(button('Cancel', 'btn small link-btn', 'cancel'));
        drawer.appendChild(actions);

        pills.addEventListener('change', function () {
            apply.disabled = pills.querySelectorAll('input:checked').length === 0;
        });

        day.querySelector('.schedule-intervals').appendChild(drawer);
        toggle.setAttribute('aria-expanded', 'true');
        toggle.classList.add('active');
        var first = pills.querySelector('input');
        if (first) {
            first.focus();
        }
    }

    function copyHours(source, targets) {
        var enabled = source.querySelector('.day-toggle input').checked;
        var list = readIntervals(source);

        targets.forEach(function (target) {
            target.querySelector('.day-toggle input').checked = enabled;
            setIntervals(target, list);
        });
    }

    scheduleForm.addEventListener('click', function (event) {
        var control = event.target.closest('button');

        if (!control) {
            return;
        }

        var day = dayOf(control);
        var action = control.getAttribute('data-action');

        if (action === 'add-interval') {
            addInterval(day, '15:00', '16:00');
        } else if (action === 'remove-interval') {
            control.closest('.schedule-interval').remove();
            relabel(day);
        } else if (action === 'toggle-copy') {
            if (day.querySelector('.inline-copy-drawer')) {
                closeDrawers();
            } else {
                openCopyDrawer(day, control);
            }
        } else if (control.hasAttribute('data-copy-action')) {
            var copyAction = control.getAttribute('data-copy-action');
            var source = dayOf(control);

            if (copyAction === 'apply') {
                var chosen = Array.prototype.map.call(control.closest('.inline-copy-drawer').querySelectorAll('input:checked'), function (box) {
                    return allDays()[Number(box.value)];
                });
                copyHours(source, chosen);
            } else if (copyAction === 'all') {
                copyHours(source, allDays().filter(function (other) {
                    return other !== source;
                }));
            }
            closeDrawers();
        }
    });
})();