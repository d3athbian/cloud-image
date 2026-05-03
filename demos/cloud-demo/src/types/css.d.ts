declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
  export = classes;
}

declare module '*.css' {
  const css: string;
  export default css;
}