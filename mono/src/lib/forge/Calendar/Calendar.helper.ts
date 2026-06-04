import { Language } from "../store";

export class Day {
  constructor(public day: number, public isCurrentMonth: boolean, public text: string = "", public bg = "transparent", public bd = "transparent", public menu = false) { }
  get toString() {
    return this.text;
  }

  static from(d: Date, daysInCalendar: number = 42) {

    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const lastDayOfPreviousMonth = new Date(d.getFullYear(), d.getMonth(), 0);
    const daysInMonth = lastDay.getDate();
    const daysInPreviousMonth = lastDayOfPreviousMonth.getDate();
    const firstDayWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    let days = [];
    for (let i = 0; i < daysInCalendar; i++) {
      if (i < firstDayWeek) {
        days.push(new Day(daysInPreviousMonth - firstDayWeek + i + 1, false));
      } else if (i < daysInMonth + firstDayWeek) {
        days.push(new Day(i - firstDayWeek + 1, true));
      } else {
        days.push(new Day(i - daysInMonth - firstDayWeek + 1, false));
      }
    }
    //If last 7 days are out of the current month, remove them
    if (days[days.length - 7].isCurrentMonth === false) {
      days = days.slice(0, daysInCalendar - 7);
    }
    return days;
  }
}

export const formatedDate = (date: Date, language: Language) => {
  const month = monthOfTheYear[language][date.getMonth()]
  const year = date.getFullYear();
  const yearStriped = year.toString().slice(0, 3);
  return ` ${month} ${yearStriped}X`;
  //return `${weekOfTheDay[language][date.getDay()]} ${date.getDate()} ${monthOfTheYear[language][date.getMonth()]} ${date.getFullYear()}`;
}

export const weekOfTheDay = {
  [Language.FR]: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  [Language.NL]: ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"],
  [Language.DE]: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
};

export enum Size {
  sm = "sm",
  md = "md",
  lg = "lg",
}

export const monthOfTheYear = {
  [Language.FR]: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ],
  [Language.NL]: [
    "Januari",
    "Februari",
    "Maart",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Augustus",
    "September",
    "Oktober",
    "November",
    "December",
  ],
  [Language.DE]: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
};