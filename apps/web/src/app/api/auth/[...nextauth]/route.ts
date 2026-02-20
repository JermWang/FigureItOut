import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Guest',
      credentials: {
        name: { label: 'Display Name', type: 'text', placeholder: 'Builder-1' },
      },
      async authorize(credentials) {
        const name = credentials?.name || `Guest-${Math.random().toString(36).slice(2, 8)}`;

        // Upsert a guest user
        let user = await prisma.user.findFirst({ where: { name } });
        if (!user) {
          user = await prisma.user.create({
            data: { name, email: `${name.toLowerCase().replace(/\s/g, '-')}@fio.local` },
          });
        }
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as Record<string, unknown>).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
