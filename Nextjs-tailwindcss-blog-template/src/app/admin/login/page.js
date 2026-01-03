import { Suspense } from 'react';
import LoginClient from './LoginDesign';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading login...</div>}>
      <LoginClient />
    </Suspense>
  );
}
