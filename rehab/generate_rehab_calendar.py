#!/usr/bin/env python3
import argparse
import csv
import dataclasses
import datetime as dt
import json
import os
import sys
import uuid
from typing import Dict, List, Optional

try:
    from zoneinfo import ZoneInfo
except Exception as exc:  # pragma: no cover
    print("Python 3.9+ with zoneinfo is required", file=sys.stderr)
    raise


WEEKDAY_MAP = {
    "Mon": 0,
    "Tue": 1,
    "Wed": 2,
    "Thu": 3,
    "Fri": 4,
    "Sat": 5,
    "Sun": 6,
}


def parse_hhmm(time_str: str) -> dt.time:
    hour, minute = [int(part) for part in time_str.split(":", 1)]
    return dt.time(hour=hour, minute=minute)


def start_of_week(date: dt.date) -> dt.date:
    return date - dt.timedelta(days=date.weekday())


@dataclasses.dataclass
class Event:
    start: dt.datetime
    end: dt.datetime
    title: str
    description: str
    location: Optional[str] = None


class CalendarBuilder:
    def __init__(self, tz_name: str) -> None:
        self.tz = ZoneInfo(tz_name)
        self.events: List[Event] = []

    def add_event(self, start_date: dt.date, time_hhmm: str, duration_min: int, title: str, description: str, location: Optional[str]) -> None:
        start_time = parse_hhmm(time_hhmm)
        start_dt = dt.datetime.combine(start_date, start_time).replace(tzinfo=self.tz)
        end_dt = start_dt + dt.timedelta(minutes=duration_min)
        self.events.append(Event(start=start_dt, end=end_dt, title=title, description=description, location=location))

    def add_event_with_times(self, start_date: dt.date, start_time: str, end_time: str, title: str, description: str, location: Optional[str]) -> None:
        st = parse_hhmm(start_time)
        et = parse_hhmm(end_time)
        start_dt = dt.datetime.combine(start_date, st).replace(tzinfo=self.tz)
        end_dt = dt.datetime.combine(start_date, et).replace(tzinfo=self.tz)
        self.events.append(Event(start=start_dt, end=end_dt, title=title, description=description, location=location))

    def write_ics(self, out_path: str) -> None:
        lines: List[str] = []
        lines.append("BEGIN:VCALENDAR")
        lines.append("VERSION:2.0")
        lines.append("PRODID:-//RehabPlanner//EN")
        lines.append("CALSCALE:GREGORIAN")
        now_utc = dt.datetime.now(dt.timezone.utc)
        for ev in self.events:
            uid = f"{uuid.uuid4()}@rehab"
            dtstamp = now_utc.strftime("%Y%m%dT%H%M%SZ")
            dtstart_utc = ev.start.astimezone(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            dtend_utc = ev.end.astimezone(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            lines.append("BEGIN:VEVENT")
            lines.append(f"UID:{uid}")
            lines.append(f"DTSTAMP:{dtstamp}")
            lines.append(f"DTSTART:{dtstart_utc}")
            lines.append(f"DTEND:{dtend_utc}")
            lines.append(f"SUMMARY:{escape_ics_text(ev.title)}")
            if ev.location:
                lines.append(f"LOCATION:{escape_ics_text(ev.location)}")
            if ev.description:
                lines.append(f"DESCRIPTION:{escape_ics_text(ev.description)}")
            lines.append("END:VEVENT")
        lines.append("END:VCALENDAR")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

    def write_csv(self, out_path: str) -> None:
        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["StartDate", "StartTime", "EndDate", "EndTime", "Title", "Description", "Location"])
            for ev in self.events:
                sd = ev.start.strftime("%Y-%m-%d")
                st = ev.start.strftime("%H:%M")
                ed = ev.end.strftime("%Y-%m-%d")
                et = ev.end.strftime("%H:%M")
                writer.writerow([sd, st, ed, et, ev.title, ev.description, ev.location or ""]) 


def escape_ics_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def add_weekly_events(builder: CalendarBuilder, base_date: dt.date, total_weeks: int, day_names: List[str], time_str: str, duration: int, title: str, location: Optional[str], description: str) -> None:
    day_indices = [WEEKDAY_MAP[name] for name in day_names]
    for week_index in range(total_weeks):
        week_start = base_date + dt.timedelta(weeks=week_index)
        for day_idx in day_indices:
            day_date = week_start + dt.timedelta(days=(day_idx - week_start.weekday()) % 7)
            # Skip events before base_date in the first week
            if week_index == 0 and day_date < base_date:
                continue
            builder.add_event(day_date, time_str, duration, title, description, location)


def add_weekly_progression_events(builder: CalendarBuilder, base_date: dt.date, total_weeks: int, day_names: List[str], start_time: str, durations_by_week: List[int], title: str, location: Optional[str], description: str) -> None:
    day_indices = [WEEKDAY_MAP[name] for name in day_names]
    for week_index in range(total_weeks):
        week_start = base_date + dt.timedelta(weeks=week_index)
        duration = durations_by_week[min(week_index, len(durations_by_week) - 1)]
        for day_idx in day_indices:
            day_date = week_start + dt.timedelta(days=(day_idx - week_start.weekday()) % 7)
            if week_index == 0 and day_date < base_date:
                continue
            builder.add_event(day_date, start_time, duration, title, description, location)


def build_description(section_title: str, patient: Dict[str, object], restrictions_note: str) -> str:
    parts: List[str] = []
    parts.append(section_title)
    if patient.get("name"):
        parts.append(f"Danışan: {patient['name']}")
    if patient.get("condition"):
        parts.append(f"Durum: {patient['condition']}")
    if patient.get("goals"):
        try:
            goals = ", ".join([str(g) for g in patient["goals"]])
            parts.append(f"Hedefler: {goals}")
        except Exception:
            pass
    if restrictions_note:
        parts.append(f"Not: {restrictions_note}")
    parts.append("Detaylı içerik: plan.md")
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description="Rehabilitasyon takvimi üretici (ICS ve CSV)")
    parser.add_argument("--config", required=True, help="JSON konfigürasyon dosyası")
    parser.add_argument("--outdir", required=True, help="Çıktı klasörü")
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    schedule = cfg.get("schedule", {})
    tz_name = schedule.get("timezone", "Europe/Istanbul")
    start_date = dt.date.fromisoformat(schedule["start_date"])  # required
    total_weeks = int(schedule.get("total_weeks", 8))

    builder = CalendarBuilder(tz_name)

    patient = cfg.get("patient", {})
    restrictions_note = cfg.get("restrictions_note", "")

    # Klinik seanslar
    clinic = cfg.get("clinic_sessions", {})
    if clinic.get("enabled", True) and clinic.get("days_of_week"):
        desc = build_description("Klinik seansı", patient, restrictions_note)
        add_weekly_events(
            builder=builder,
            base_date=start_date,
            total_weeks=total_weeks,
            day_names=clinic["days_of_week"],
            time_str=clinic.get("time", "18:00"),
            duration=int(clinic.get("duration_minutes", 60)),
            title=str(clinic.get("title", "Fizyoterapi Seansı")),
            location=clinic.get("location"),
            description=desc,
        )

    # Ev egzersizleri
    home = cfg.get("home_exercises", {})
    if home.get("enabled", True) and home.get("days_of_week"):
        desc = build_description("Ev egzersizleri", patient, restrictions_note)
        add_weekly_events(
            builder=builder,
            base_date=start_date,
            total_weeks=total_weeks,
            day_names=home["days_of_week"],
            time_str=home.get("time", "09:00"),
            duration=int(home.get("duration_minutes", 20)),
            title=str(home.get("title", "Ev Egzersizleri")),
            location=home.get("location"),
            description=desc,
        )

    # Yürüyüş/kardiyo
    cardio = cfg.get("cardio_walk", {})
    if cardio.get("enabled", True) and cardio.get("days_of_week"):
        desc = build_description("Kardiyo / Yürüyüş", patient, restrictions_note)
        durations = cardio.get("duration_progression_minutes", [15] * total_weeks)
        add_weekly_progression_events(
            builder=builder,
            base_date=start_date,
            total_weeks=total_weeks,
            day_names=cardio["days_of_week"],
            start_time=cardio.get("start_time", "19:00"),
            durations_by_week=[int(x) for x in durations],
            title=str(cardio.get("title", "Yürüyüş/Kardiyo")),
            location=cardio.get("location"),
            description=desc,
        )

    # Haftalık değerlendirme
    check_in = cfg.get("check_in", {})
    if check_in.get("enabled", True) and check_in.get("day_of_week"):
        desc = build_description("Haftalık durum değerlendirmesi (ağrı, EHA, kuvvet, fonksiyon)", patient, restrictions_note)
        day = check_in["day_of_week"]
        add_weekly_events(
            builder=builder,
            base_date=start_date,
            total_weeks=total_weeks,
            day_names=[day],
            time_str=check_in.get("time", "20:00"),
            duration=int(check_in.get("duration_minutes", 20)),
            title=str(check_in.get("title", "Haftalık Durum Değerlendirmesi")),
            location=check_in.get("location"),
            description=desc,
        )

    # Çıktı
    os.makedirs(args.outdir, exist_ok=True)
    ics_path = os.path.join(args.outdir, "rehab_calendar.ics")
    csv_path = os.path.join(args.outdir, "rehab_calendar.csv")
    builder.write_ics(ics_path)
    builder.write_csv(csv_path)

    print(f"ICS yazıldı: {ics_path}")
    print(f"CSV yazıldı: {csv_path}")


if __name__ == "__main__":
    main()