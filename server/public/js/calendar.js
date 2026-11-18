// Week calendar filters (morning / afternoon and faculty).
// Week navigation, the weekend switch and choosing a slot are normal links and work without this file.
// Without JavaScript every time of the week is simply shown.

var calendar = document.getElementById('week-calendar');

if (calendar) {
    var filters = document.getElementById('week-filters');
    var periodToggle = document.getElementById('period-toggle');
    var periodLabel = document.getElementById('period-label');
    var facultySelect = document.getElementById('calendar-faculty');
    var notice = document.getElementById('calendar-notice');
    var items = calendar.querySelectorAll('.calendar-slot');
    var days = calendar.querySelectorAll('.calendar-day');

    var PERIODS = {
        morning: 'Morning · before noon',
        afternoon: 'Afternoon / evening · noon onwards'
    };

    var period = 'morning';

    // Number of items in a period (respecting the faculty filter, own appointments always count).
    function countFor(name) {
        var total = 0;
        items.forEach(function (item) {
            if (item.getAttribute('data-period') === name && matchesFaculty(item)) {
                total++;
            }
        });
        return total;
    }

    function matchesFaculty(item) {
        var chosen = facultySelect ? facultySelect.value : '';
        var owner = item.getAttribute('data-faculty');
        return !chosen || !owner || owner === chosen;
    }

    function drawToggle() {
        periodToggle.innerHTML = '';

        ['morning', 'afternoon'].forEach(function (name) {
            var button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('aria-pressed', name === period ? 'true' : 'false');
            button.textContent = (name === 'morning' ? 'Morning' : 'Afternoon') + ' (' + countFor(name) + ')';
            button.addEventListener('click', function () {
                period = name;
                apply();
            });
            periodToggle.appendChild(button);
        });
    }

    function apply() {
        items.forEach(function (item) {
            var show = item.getAttribute('data-period') === period && matchesFaculty(item);
            item.hidden = !show;
        });

        days.forEach(function (day) {
            var visible = day.querySelectorAll('.calendar-slot:not([hidden])').length;
            var empty = day.querySelector('.calendar-empty');
            if (empty) {
                empty.hidden = visible > 0;
                empty.textContent = 'No times in this period';
            }
        });

        periodLabel.textContent = PERIODS[period];
        drawToggle();

        var other = period === 'morning' ? 'afternoon' : 'morning';
        var total = countFor('morning') + countFor('afternoon');

        if (countFor(period) === 0 && total > 0) {
            notice.textContent = 'No available times in this period. ' + countFor(other) + ' available in the other period this week.';
            notice.hidden = false;
        } else if (total === 0) {
            notice.textContent = 'No available times this week. Use the arrows to look at another week.';
            notice.hidden = false;
        } else {
            notice.hidden = true;
        }
    }

    // Start on the period that has something to show.
    if (countFor('morning') === 0 && countFor('afternoon') > 0) {
        period = 'afternoon';
    }

    // The faculty filter is only useful when more than one faculty member has open times.
    if (facultySelect && facultySelect.options.length <= 2) {
        document.getElementById('calendar-faculty-label').remove();
        facultySelect = null;
    }

    filters.hidden = false;

    if (facultySelect) {
        facultySelect.addEventListener('change', function () {
            if (countFor(period) === 0 && countFor(period === 'morning' ? 'afternoon' : 'morning') > 0) {
                period = period === 'morning' ? 'afternoon' : 'morning';
            }
            apply();
        });
    }

    apply();
}