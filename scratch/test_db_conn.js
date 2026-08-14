const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jfwxbsfjgzjcuwdivvor:%401s2s3s4s5S@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=5"
    }
  }
});

async function main() {
  try {
    console.log('Connecting to database...');
    const users = await prisma.user.findMany({ take: 2 });
    console.log('USERS FOUND:', users.length);
  } catch (err) {
    console.error('DB ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
