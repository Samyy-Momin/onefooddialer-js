// OneFoodDialer - Public Businesses API (for signup)
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Get all active businesses for signup selection
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      data: businesses,
      total: businesses.length,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
