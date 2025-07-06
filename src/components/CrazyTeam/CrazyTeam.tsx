import React from 'react';
import styles from './CrazyTeam.module.css';
import { useLanguage } from '@/hooks/useLanguage';

const CrazyTeam = () => {
  const { getComponentText } = useLanguage();

  const teamMembers = [
    {
      name: "Maria Georgiou",
      role: getComponentText('crazyTeam', 'members.maria.role'),
      linkedin: "https://www.linkedin.com/in/maria-georgiou-556277373?trk=contact-info",
      image: "/team/maria.jpg",
      skills: [
        getComponentText('crazyTeam', 'skills.smartContracts'),
        getComponentText('crazyTeam', 'skills.defiDev'),
        getComponentText('crazyTeam', 'skills.security')
      ],
      description: getComponentText('crazyTeam', 'members.maria.description')
    },
    {
      name: "Nikos Antoniou", 
      role: getComponentText('crazyTeam', 'members.nikos.role'),
      linkedin: "https://www.linkedin.com/in/nikos-antoniou-901273373?trk=contact-info",
      image: "/team/nikos.jpg",
      skills: [
        getComponentText('crazyTeam', 'skills.marketing'),
        getComponentText('crazyTeam', 'skills.community'),
        getComponentText('crazyTeam', 'skills.partnerships')
      ],
      description: getComponentText('crazyTeam', 'members.nikos.description')
    },
    {
      name: "Elena Papadopoulou",
      role: getComponentText('crazyTeam', 'members.elena.role'),
      linkedin: "https://www.linkedin.com/in/elena-papadopoulou-559273373?trk=contact-info",
      image: "/team/elena.jpg",
      skills: [
        getComponentText('crazyTeam', 'skills.product'),
        getComponentText('crazyTeam', 'skills.ux'),
        getComponentText('crazyTeam', 'skills.design')
      ],
      description: getComponentText('crazyTeam', 'members.elena.description')
    },
    {
      name: "Tim Herald",
      role: getComponentText('crazyTeam', 'members.tim.role'),
      linkedin: "https://www.linkedin.com/in/tim-herald-a6126a373",
      image: "/team/tim.jpg",
      skills: [
        getComponentText('crazyTeam', 'skills.financial'),
        getComponentText('crazyTeam', 'skills.tokenomics'),
        getComponentText('crazyTeam', 'skills.risk')
      ],
      description: getComponentText('crazyTeam', 'members.tim.description')
    }
  ];

  return (
    <section className={styles.teamSection} id="team">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {getComponentText('crazyTeam', 'title')} 🦊
          </h2>
          <p className={styles.subtitle}>
            {getComponentText('crazyTeam', 'subtitle')}
          </p>
        </div>

        {/* Team Grid */}
        <div className={styles.teamGrid}>
          {teamMembers.map((member, index) => (
            <div key={index} className={styles.memberCard}>
              {/* Background Effects */}
              <div className={styles.cardGlow}></div>
              
              {/* Member Photo */}
              <div className={styles.photoContainer}>
                <img 
                  src={member.image} 
                  alt={member.name}
                  className={styles.memberPhoto}
                />
                <div className={styles.photoOverlay}></div>
              </div>

              {/* Member Info */}
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{member.name}</h3>
                <p className={styles.memberRole}>{member.role}</p>
                <p className={styles.memberDescription}>{member.description}</p>
                
                {/* Skills */}
                <div className={styles.skillsContainer}>
                  {member.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* LinkedIn Button */}
                <a 
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkedinButton}
                >
                  <span className={styles.linkedinIcon}>💼</span>
                  {getComponentText('crazyTeam', 'connectLinkedin')}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Team Stats */}
        <div className={styles.teamStats}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>4</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyTeam', 'stats.coreMembers')}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>20+</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyTeam', 'stats.experience')}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyTeam', 'stats.support')}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>🌍</div>
            <div className={styles.statLabel}>
              {getComponentText('crazyTeam', 'stats.global')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CrazyTeam;