# tests/test_hours.py
import pytest
from datetime import date
from unittest.mock import patch, MagicMock

def test_school_year_range_during_fall():
    from app.utils.hours import school_year_range
    # October 2025 → school year 2025-2026
    start, end = school_year_range(today=date(2025, 10, 15))
    assert start == date(2025, 9, 1)
    assert end == date(2026, 8, 31)

def test_school_year_range_during_spring():
    from app.utils.hours import school_year_range
    # April 2026 → still school year 2025-2026
    start, end = school_year_range(today=date(2026, 4, 10))
    assert start == date(2025, 9, 1)
    assert end == date(2026, 8, 31)

def test_school_year_range_on_sept_1():
    from app.utils.hours import school_year_range
    # Sept 1 is the first day of the new school year
    start, end = school_year_range(today=date(2026, 9, 1))
    assert start == date(2026, 9, 1)
    assert end == date(2027, 8, 31)

def test_hours_remaining_no_hours():
    from app.utils.hours import hours_remaining
    with patch('app.utils.hours.hours_earned', return_value=0.0):
        assert hours_remaining(MagicMock()) == 10.0

def test_hours_remaining_partial():
    from app.utils.hours import hours_remaining
    with patch('app.utils.hours.hours_earned', return_value=3.0):
        assert hours_remaining(MagicMock()) == 7.0

def test_hours_remaining_goal_met():
    from app.utils.hours import hours_remaining
    with patch('app.utils.hours.hours_earned', return_value=12.0):
        assert hours_remaining(MagicMock()) == 0.0  # never negative

def test_progress_color_red_below_3():
    from app.utils.hours import progress_color
    assert progress_color(0.0) == 'danger'
    assert progress_color(2.9) == 'danger'

def test_progress_color_yellow_3_to_7():
    from app.utils.hours import progress_color
    assert progress_color(3.0) == 'warning'
    assert progress_color(6.9) == 'warning'

def test_progress_color_green_at_7():
    from app.utils.hours import progress_color
    assert progress_color(7.0) == 'success'
    assert progress_color(10.0) == 'success'
