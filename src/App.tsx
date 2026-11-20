/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Analytics } from '@vercel/analytics/react';
import Demo from "../demo";

export default function App() {
  return (
    <>
      <Demo />
      <Analytics />
    </>
  );
}

