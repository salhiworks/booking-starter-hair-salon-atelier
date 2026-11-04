import type { SiteImage } from '@profitstudio/booking-engine';
import { useContent } from '../lib/content';
import { initials } from '../lib/format';
import { useSectionNumber } from '../lib/sections';
import { PhotoFrame } from './PhotoFrame';

/** Work photos for the sample profiles (hands at work, never a face): no invented staff. */
const SAMPLE_PHOTOS: SiteImage[] = [
  { src: '/photos/sample-color-922.webp', alt: 'Sample photo: a colorist’s hands painting caramel balayage onto long brown hair', width: 922, height: 1152 },
  { src: '/photos/sample-precision-922.webp', alt: 'Sample photo: a stylist refining a short cut at the nape with comb and scissors', width: 922, height: 1152 },
  { src: '/photos/sample-curls-922.webp', alt: 'Sample photo: a stylist’s hands shaping defined natural curls with cream', width: 922, height: 1152 },
];

/**
 * The stylists. Until the owner sets the team in the dashboard (Website →
 * Stylists), the sample profiles say so, and their photos are work, never a face.
 */
export function TeamSection() {
  const { values, ownerFields } = useContent();
  const number = useSectionNumber('team');
  const members = values['team.members'];
  const sample = !ownerFields.includes('team.members');
  if (members.length === 0) return null;
  return (
    <section id="team" className="section team" aria-labelledby="team-title">
      <div className="wrap">
        <header className="team__head">
          <div>
            <p className="sec-label">
              <span className="sec-no">{number}</span>
              <span className="kicker">Team</span>
            </p>
            <h2 id="team-title" className="display sec-title">
              {values['team.title']}
            </h2>
          </div>
          <div className="team__aside">
            {values['team.intro'] ? <p className="sec-intro">{values['team.intro']}</p> : null}
            {sample ? (
              <p className="team__note">
                <span className="tag">Sample</span> Sample profiles, shown until the salon adds its own team.
              </p>
            ) : null}
          </div>
        </header>
        <ul className={`team__grid team__grid--${Math.min(members.length, 4)}`}>
          {members.map((member, index) => (
            <li className="member" key={`${index}-${member.name}`}>
              <PhotoFrame
                className="member__photo plate--hover"
                image={sample ? (SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length] ?? null) : member.portrait}
                badge={sample ? 'Sample photo' : undefined}
                fallback={initials(member.name)}
                sizes="(min-width: 60em) 28vw, (min-width: 40em) 45vw, 92vw"
              />
              <h3 className="member__name">{member.name}</h3>
              {member.role ? <p className="member__role">{member.role}</p> : null}
              {member.bio ? <p className="member__bio">{member.bio}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
