const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.mention.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleaned existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'john.lead@example.com', name: 'John Smith', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'sarah.lead@example.com', name: 'Sarah Johnson', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'mike.dev@example.com', name: 'Mike Chen', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'emma.dev@example.com', name: 'Emma Wilson', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'alex.dev@example.com', name: 'Alex Brown', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'lisa.design@example.com', name: 'Lisa Davis', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'tom.dev@example.com', name: 'Tom Miller', password: hashedPassword },
    }),
    prisma.user.create({
      data: { email: 'jane.pm@example.com', name: 'Jane Taylor', password: hashedPassword },
    }),
  ]);

  console.log('✓ Created ' + users.length + ' users');

  const [john, sarah, mike, emma, alex, lisa, tom, jane] = users;

  // Create teams
  const productTeam = await prisma.team.create({
    data: { name: 'Product Team', description: 'Main product development team' },
  });
  const designTeam = await prisma.team.create({
    data: { name: 'Design Team', description: 'UI/UX design and creative' },
  });
  const engineeringTeam = await prisma.team.create({
    data: { name: 'Engineering Team', description: 'Backend and infrastructure' },
  });

  console.log('✓ Created 3 teams');

  // Add team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: productTeam.id, userId: john.id, role: 'MANAGER' },
      { teamId: productTeam.id, userId: mike.id, role: 'MEMBER' },
      { teamId: productTeam.id, userId: emma.id, role: 'MEMBER' },
      { teamId: productTeam.id, userId: jane.id, role: 'MEMBER' },
      { teamId: designTeam.id, userId: sarah.id, role: 'MANAGER' },
      { teamId: designTeam.id, userId: lisa.id, role: 'MEMBER' },
      { teamId: designTeam.id, userId: alex.id, role: 'MEMBER' },
      { teamId: engineeringTeam.id, userId: john.id, role: 'MANAGER' },
      { teamId: engineeringTeam.id, userId: tom.id, role: 'MEMBER' },
      { teamId: engineeringTeam.id, userId: alex.id, role: 'MEMBER' },
    ],
  });

  console.log('✓ Added team members');

  // Create channels
  const productChannels = await Promise.all([
    prisma.channel.create({ data: { teamId: productTeam.id, name: 'general', description: 'General discussions', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: productTeam.id, name: 'announcements', description: 'Team announcements', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: productTeam.id, name: 'dev-discussion', description: 'Technical discussions', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: productTeam.id, name: 'random', description: 'Off-topic fun', type: 'PUBLIC' } }),
  ]);

  const designChannels = await Promise.all([
    prisma.channel.create({ data: { teamId: designTeam.id, name: 'general', description: 'Design team general', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: designTeam.id, name: 'ui-feedback', description: 'UI feedback', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: designTeam.id, name: 'inspiration', description: 'Design inspiration', type: 'PUBLIC' } }),
  ]);

  const engineeringChannels = await Promise.all([
    prisma.channel.create({ data: { teamId: engineeringTeam.id, name: 'general', description: 'Engineering general', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: engineeringTeam.id, name: 'backend', description: 'Backend dev', type: 'PUBLIC' } }),
    prisma.channel.create({ data: { teamId: engineeringTeam.id, name: 'devops', description: 'DevOps', type: 'PUBLIC' } }),
  ]);

  console.log('✓ Created channels');

  // Create messages
  const productGeneral = productChannels[0];
  const productDev = productChannels[2];
  const designGeneral = designChannels[0];
  const engineeringGeneral = engineeringChannels[0];

  const messageData = [
    { channelId: productGeneral.id, authorId: john.id, content: 'Good morning team! Great week ahead.', daysAgo: 7 },
    { channelId: productGeneral.id, authorId: mike.id, content: 'Morning! Ready to tackle the new feature.', daysAgo: 7 },
    { channelId: productGeneral.id, authorId: emma.id, content: 'Reviewing the sprint backlog.', daysAgo: 6 },
    { channelId: productGeneral.id, authorId: jane.id, content: 'User research insights ready.', daysAgo: 6 },
    { channelId: productGeneral.id, authorId: john.id, content: 'Great work Jane!', daysAgo: 6 },
    { channelId: productGeneral.id, authorId: mike.id, content: 'I need those insights for notifications.', daysAgo: 5 },
    { channelId: productGeneral.id, authorId: emma.id, content: 'Working on API integration.', daysAgo: 5 },
    { channelId: productGeneral.id, authorId: john.id, content: 'Sprint planning tomorrow at 10 AM.', daysAgo: 4 },
    { channelId: productGeneral.id, authorId: jane.id, content: 'I will prepare user stories.', daysAgo: 4 },
    { channelId: productGeneral.id, authorId: mike.id, content: 'Dashboard redesign looks amazing!', daysAgo: 3 },
    { channelId: productGeneral.id, authorId: emma.id, content: 'Thanks! Sidebar was fun to build.', daysAgo: 3 },
    { channelId: productGeneral.id, authorId: john.id, content: 'Code review session this afternoon.', daysAgo: 2 },
    { channelId: productGeneral.id, authorId: mike.id, content: 'Sounds good!', daysAgo: 2 },
    { channelId: productGeneral.id, authorId: emma.id, content: 'Notification system complete!', daysAgo: 1 },
    { channelId: productGeneral.id, authorId: jane.id, content: 'Awesome! Testing it now.', daysAgo: 1 },
    { channelId: productGeneral.id, authorId: john.id, content: 'Great progress this week!', daysAgo: 0 },
    { channelId: productDev.id, authorId: mike.id, content: 'Anyone familiar with Prisma?', daysAgo: 5 },
    { channelId: productDev.id, authorId: emma.id, content: 'Yes, what do you need?', daysAgo: 5 },
    { channelId: productDev.id, authorId: mike.id, content: 'Adding field to Notification model.', daysAgo: 5 },
    { channelId: productDev.id, authorId: emma.id, content: 'Run npx prisma migrate dev', daysAgo: 5 },
    { channelId: productDev.id, authorId: john.id, content: 'Update seed file too.', daysAgo: 4 },
    { channelId: productDev.id, authorId: mike.id, content: 'Got it working, thanks!', daysAgo: 4 },
    { channelId: designGeneral.id, authorId: sarah.id, content: 'Review the new color palette.', daysAgo: 6 },
    { channelId: designGeneral.id, authorId: lisa.id, content: 'Love the purple gradient!', daysAgo: 6 },
    { channelId: designGeneral.id, authorId: alex.id, content: 'Dashboard looks clean.', daysAgo: 5 },
    { channelId: designGeneral.id, authorId: sarah.id, content: 'Ensure accessibility.', daysAgo: 5 },
    { channelId: designGeneral.id, authorId: lisa.id, content: 'Adding proper contrast.', daysAgo: 4 },
    { channelId: designGeneral.id, authorId: alex.id, content: 'Should we add dark mode?', daysAgo: 3 },
    { channelId: designGeneral.id, authorId: sarah.id, content: 'Yes, in Q1 roadmap.', daysAgo: 3 },
    { channelId: designGeneral.id, authorId: lisa.id, content: 'Icon set is consistent.', daysAgo: 2 },
    { channelId: designGeneral.id, authorId: alex.id, content: 'Looking great!', daysAgo: 1 },
    { channelId: engineeringGeneral.id, authorId: john.id, content: 'Database performance good.', daysAgo: 5 },
    { channelId: engineeringGeneral.id, authorId: tom.id, content: 'Optimized queries.', daysAgo: 5 },
    { channelId: engineeringGeneral.id, authorId: alex.id, content: 'Indexes helped a lot.', daysAgo: 4 },
    { channelId: engineeringGeneral.id, authorId: john.id, content: 'Set up monitoring next.', daysAgo: 3 },
    { channelId: engineeringGeneral.id, authorId: tom.id, content: 'Configuring Prometheus.', daysAgo: 2 },
    { channelId: engineeringGeneral.id, authorId: alex.id, content: 'Grafana dashboards ready.', daysAgo: 1 },
    { channelId: engineeringGeneral.id, authorId: john.id, content: 'Excellent work team!', daysAgo: 0 },
  ];

  for (const msg of messageData) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - msg.daysAgo);
    createdAt.setHours(Math.floor(Math.random() * 10) + 9);
    createdAt.setMinutes(Math.floor(Math.random() * 60));
    await prisma.message.create({
      data: { channelId: msg.channelId, authorId: msg.authorId, content: msg.content, createdAt },
    });
  }

  console.log('✓ Created ' + messageData.length + ' messages');

  // Create decisions
  await prisma.decision.createMany({
    data: [
      { channelId: productGeneral.id, ownerId: john.id, title: 'Adopt Slack-inspired sidebar', description: 'Collapsible sections with purple gradient.', status: 'RESOLVED' },
      { channelId: productGeneral.id, ownerId: emma.id, title: 'Implement notification system', description: 'Notifications for invites and promotions.', status: 'RESOLVED' },
      { channelId: productDev.id, ownerId: mike.id, title: 'Use Prisma for ORM', description: 'Type-safe database access.', status: 'RESOLVED' },
      { channelId: designGeneral.id, ownerId: sarah.id, title: 'GitHub Insights dashboard', description: 'Contribution graphs and activity feeds.', status: 'RESOLVED' },
      { channelId: engineeringGeneral.id, ownerId: john.id, title: 'Add database indexes', description: 'Indexes on frequently queried fields.', status: 'RESOLVED' },
    ],
  });

  console.log('✓ Created decisions');

  // Create join request and invitation
  await prisma.joinRequest.create({
    data: { userId: tom.id, teamId: productTeam.id, message: 'I want to contribute!', status: 'PENDING' },
  });
  await prisma.invitation.create({
    data: { inviterId: sarah.id, inviteeId: emma.id, teamId: designTeam.id, message: 'Join our team!', status: 'PENDING' },
  });

  console.log('✓ Created join request and invitation');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: emma.id, type: 'INVITE_RECEIVED', title: 'Team Invitation', message: 'Sarah Johnson invited you to join Design Team', isRead: false },
    ],
  });

  console.log('✓ Created notifications');
  console.log('\n✅ Database seeded successfully!');
  console.log('\n📧 Test accounts (password: password123):');
  console.log('   Team Lead: john.lead@example.com');
  console.log('   Team Lead: sarah.lead@example.com');
  console.log('   Member: mike.dev@example.com');
  console.log('   Member: emma.dev@example.com');
}

main()
  .catch((e) => { console.error('Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
