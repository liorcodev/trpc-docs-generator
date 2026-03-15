import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { writeFileSync } from 'fs';
import { collectRoutes } from '../src/collect-routes';
import { generateDocsHtml } from '../src/generate-html';
import type { RouteMeta } from '../src/types';

const t = initTRPC.meta<RouteMeta>().create();

const appRouter = t.router({
  health: t.procedure
    .meta({
      name: 'Health Check',
      docs: {
        description: 'Returns the current health status of the API.',
        tags: ['System']
      }
    })
    .output(z.object({ status: z.literal('ok'), uptime: z.number() }))
    .query(() => ({ status: 'ok' as const, uptime: 0 })),

  users: t.router({
    list: t.procedure
      .meta({
        name: 'List Users',
        docs: {
          description: 'Returns a paginated list of users. Requires admin role.',
          tags: ['Users'],
          auth: true,
          roles: ['admin']
        }
      })
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional()
        })
      )
      .output(
        z.object({
          users: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              email: z.email(),
              createdAt: z.string()
            })
          ),
          total: z.number(),
          page: z.number(),
          totalPages: z.number()
        })
      )
      .query(async () => ({ users: [], total: 0, page: 1, totalPages: 0 })),

    getById: t.procedure
      .meta({
        name: 'Get User',
        docs: {
          description: 'Retrieve a single user by their unique ID.',
          tags: ['Users'],
          auth: true
        }
      })
      .input(z.object({ id: z.string().uuid() }))
      .output(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.email(),
          role: z.enum(['admin', 'editor', 'viewer']),
          createdAt: z.string()
        })
      )
      .query(async () => ({ id: '', name: '', email: '', role: 'viewer' as const, createdAt: '' })),

    create: t.procedure
      .meta({
        name: 'Create User',
        docs: {
          description: 'Create a new user account.',
          tags: ['Users'],
          auth: true,
          roles: ['admin']
        }
      })
      .input(
        z.object({
          name: z.string().min(1).max(100),
          email: z.email(),
          role: z.enum(['admin', 'editor', 'viewer']).optional(),
          password: z.string().min(8)
        })
      )
      .output(z.object({ id: z.string(), name: z.string(), email: z.string() }))
      .mutation(async () => ({ id: '', name: '', email: '' })),

    delete: t.procedure
      .meta({
        name: 'Delete User',
        docs: {
          description: 'Permanently delete a user account. This action cannot be undone.',
          tags: ['Users'],
          auth: true,
          roles: ['admin'],
          deprecated: false
        }
      })
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .mutation(async () => ({ success: true })),

    getByEmail: t.procedure
      .meta({
        name: 'Get User by Email',
        docs: {
          description: 'Retrieve a user by email address. Use getById instead.',
          tags: ['Users'],
          auth: true,
          deprecated: true
        }
      })
      .input(z.object({ email: z.email() }))
      .output(z.object({ id: z.string(), name: z.string(), email: z.string() }))
      .query(async () => ({ id: '', name: '', email: '' }))
  }),

  posts: t.router({
    list: t.procedure
      .meta({
        name: 'List Posts',
        docs: {
          description: 'Returns a list of published blog posts.',
          tags: ['Posts']
        }
      })
      .input(
        z.object({
          page: z.number().default(1),
          tag: z.string().optional()
        })
      )
      .output(
        z.object({
          posts: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              excerpt: z.string(),
              author: z.string(),
              publishedAt: z.string(),
              tags: z.array(z.string())
            })
          ),
          total: z.number()
        })
      )
      .query(async () => ({ posts: [], total: 0 })),

    create: t.procedure
      .meta({
        name: 'Create Post',
        docs: {
          description: 'Create a new blog post.',
          tags: ['Posts'],
          auth: true,
          roles: ['admin', 'editor']
        }
      })
      .input(
        z.object({
          title: z.string().min(1).max(200),
          content: z.string().min(1),
          tags: z.array(z.string()).optional(),
          publishedAt: z.string().optional()
        })
      )
      .output(z.object({ id: z.string(), title: z.string(), slug: z.string() }))
      .mutation(async () => ({ id: '', title: '', slug: '' }))
  }),

  auth: t.router({
    login: t.procedure
      .meta({
        name: 'Login',
        docs: {
          description: 'Authenticate with email and password. Returns a JWT token.',
          tags: ['Auth']
        }
      })
      .input(z.object({ email: z.email(), password: z.string() }))
      .output(
        z.object({
          token: z.string(),
          expiresAt: z.string(),
          user: z.object({ id: z.string(), name: z.string(), role: z.string() })
        })
      )
      .mutation(async () => ({ token: '', expiresAt: '', user: { id: '', name: '', role: '' } })),

    logout: t.procedure
      .meta({
        name: 'Logout',
        docs: {
          description: 'Invalidate the current session token.',
          tags: ['Auth'],
          auth: true
        }
      })
      .output(z.object({ success: z.boolean() }))
      .mutation(async () => ({ success: true })),

    me: t.procedure
      .meta({
        name: 'Get Current User',
        docs: {
          description: 'Returns the currently authenticated user.',
          tags: ['Auth'],
          auth: true
        }
      })
      .output(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          role: z.string()
        })
      )
      .query(async () => ({ id: '', name: '', email: '', role: '' }))
  })
});

const routes = collectRoutes(appRouter);
const html = generateDocsHtml(routes, { title: 'Example API Docs' });

writeFileSync('preview.html', html, 'utf-8');
console.log(`✅ preview.html generated (${routes.length} routes)`);
