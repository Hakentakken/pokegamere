import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<'a'>, 'rel'>;

/** Use for every download destination, including future catalogue entries.
 * Keep the relationship policy here so individual buttons cannot omit it. */
export default function DownloadLink(props: Props) {
  return <a {...props} rel="nofollow noopener noreferrer" />;
}
