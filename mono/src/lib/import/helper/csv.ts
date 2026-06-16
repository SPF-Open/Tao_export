export class CSV extends Array<Array<string | number>> {
  maxCol = 0;

  constructor({ header }) {
    super(new Array<string>(1));
    if (header) this.setHeader(header);
  }

  setHeader(head: string[]) {
    this[0] = head;
    this.maxCol = head.length;
  }

  addSequentially(s: string | number) {
    const lastLine = this[this.length - 1];
    if (lastLine.length >= this.maxCol || this.length === 1) {
      this.push(new Array(0));
      return this.addSequentially(s);
    }
    return lastLine.push(s);
  }

  toString(): string {
    return this.map((c) =>
      c
        .map((e) => (typeof e === 'string' ? '"' + e.trim() + '"' : e))
        .join(';'),
    ).join('\r\n');
  }

  toStringEncoded() {
    const rules = [
      {
        from: /(\r\n|\n|\r)/gm,
        to: ' ',
      },
      {
        from: '"',
        to: '""',
      },
    ];
    return this.map((l) =>
      l
        .map((v) => {
          if (typeof v === 'string') {
            rules.forEach(({ from, to }) => {
              //@ts-expect-error 'v' will always be a string in this case
              v = v.replaceAll(from, to);
            });
          }
          return v;
        })
        .map((e) => (typeof e === 'string' ? '"' + e.trim() + '"' : e)) // Add trailing ""
        .join(';'),
    ) // Add CSV separator
      .join('\r\n'); // Add break line
  }

  // static readString(csv: string) {
  //   //TODO : Not implemented
  // }
}
