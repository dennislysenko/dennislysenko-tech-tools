declare module 'jstat' {
  interface Distribution {
    cdf(x: number, ...params: number[]): number;
    inv(p: number, ...params: number[]): number;
    sample(...params: number[]): number;
  }

  const pkg: {
    jStat: {
      normal: Distribution;
      studentt: Distribution;
      beta: Distribution;
      gamma: Distribution;
    };
  };
  export default pkg;
}
