// eslint-disable-next-line @typescript-eslint/no-require-imports
const { redirect } = require('next/navigation') as {
  redirect: (url: string) => never;
};

export default function Home() {
  redirect('/archive');
}
