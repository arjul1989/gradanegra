const Joi = require('joi');

/**
 * Validation schemas for authentication endpoints
 */

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required'
  }),
  role: Joi.string()
    .valid('platform_admin', 'tenant_admin', 'finance', 'operations')
    .required()
    .messages({
      'any.only': 'Role must be one of: platform_admin, tenant_admin, finance, operations',
      'any.required': 'Role is required'
    }),
  tenantId: Joi.string().when('role', {
    is: Joi.string().valid('tenant_admin', 'finance', 'operations'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'Tenant ID is required for tenant users'
  })
});

const loginSchema = Joi.object({
  firebaseUid: Joi.string().required().messages({
    'any.required': 'Firebase UID is required'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters'
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});

const createTenantSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'El email es requerido'
    }),
  logoUrl: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.uri': 'La URL del logo debe ser válida'
    }),
  settings: Joi.object({
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).optional(),
    taxRate: Joi.number().min(0).max(1).optional()
  }).optional(),
  contactInfo: Joi.object({
    phone: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    country: Joi.string().length(2).optional(),
    postalCode: Joi.string().allow('').optional()
  }).optional(),
  adminUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    displayName: Joi.string().optional()
  }).optional()
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  email: Joi.string().email().optional(),
  logoUrl: Joi.string().uri().allow(null, '').optional(),
  status: Joi.string().valid('active', 'suspended', 'inactive').optional(),
  settings: Joi.object({
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).optional(),
    taxRate: Joi.number().min(0).max(1).optional()
  }).optional(),
  contactInfo: Joi.object({
    phone: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    country: Joi.string().length(2).optional(),
    postalCode: Joi.string().allow('').optional()
  }).optional()
});

const createTenantAdminSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
  displayName: Joi.string().optional(),
  permissions: Joi.array()
    .items(Joi.string().valid('manage_events', 'manage_tickets', 'view_reports', 'manage_users'))
    .optional()
});

const createEventSchema = Joi.object({
  tenantId: Joi.string()
    .required()
    .messages({
      'any.required': 'El ID del tenant es requerido'
    }),
  name: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 200 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  description: Joi.string()
    .max(5000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'La descripción no puede exceder 5000 caracteres'
    }),
  date: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.min': 'La fecha debe ser futura',
      'any.required': 'La fecha del evento es requerida'
    }),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('date'))
    .optional()
    .messages({
      'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
    }),
  venue: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    country: Joi.string().length(2).default('MX'),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional()
  }).required(),
  capacity: Joi.number()
    .min(1)
    .max(1000)
    .default(1000)
    .messages({
      'number.min': 'La capacidad mínima es 1',
      'number.max': 'La capacidad máxima es 1000'
    }),
  tiers: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).allow('').optional(),
        price: Joi.number().min(0).required(),
        capacity: Joi.number().min(1).required(),
        sold: Joi.number().min(0).default(0),
        benefits: Joi.array().items(Joi.string()).optional(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
      })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Máximo 10 tipos de entrada permitidos'
    }),
  images: Joi.object({
    banner: Joi.string().uri().allow(null).optional(),
    thumbnail: Joi.string().uri().allow(null).optional(),
    gallery: Joi.array().items(Joi.string().uri()).optional()
  }).optional(),
  settings: Joi.object({
    isPublic: Joi.boolean().default(true),
    requiresApproval: Joi.boolean().default(false),
    allowTransfers: Joi.boolean().default(false),
    maxTicketsPerPurchase: Joi.number().min(1).max(20).default(10)
  }).optional(),
  metadata: Joi.object({
    category: Joi.string().allow('').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    ageRestriction: Joi.string().allow(null).optional()
  }).optional()
});

const updateEventSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(5000).allow('').optional(),
  date: Joi.date().iso().min('now').optional(),
  endDate: Joi.date().iso().optional(),
  venue: Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    country: Joi.string().length(2).optional(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional()
  }).optional(),
  capacity: Joi.number().min(1).max(1000).optional(),
  status: Joi.string().valid('draft', 'published', 'active', 'past', 'cancelled').optional(),
  tiers: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500).allow('').optional(),
        price: Joi.number().min(0).required(),
        capacity: Joi.number().min(1).required(),
        sold: Joi.number().min(0).optional(),
        benefits: Joi.array().items(Joi.string()).optional(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
      })
    )
    .max(10)
    .optional(),
  images: Joi.object({
    banner: Joi.string().uri().allow(null).optional(),
    thumbnail: Joi.string().uri().allow(null).optional(),
    gallery: Joi.array().items(Joi.string().uri()).optional()
  }).optional(),
  settings: Joi.object({
    isPublic: Joi.boolean().optional(),
    requiresApproval: Joi.boolean().optional(),
    allowTransfers: Joi.boolean().optional(),
    maxTicketsPerPurchase: Joi.number().min(1).max(20).optional()
  }).optional(),
  metadata: Joi.object({
    category: Joi.string().allow('').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    ageRestriction: Joi.string().allow(null).optional()
  }).optional()
});

const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
  displayName: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  role: Joi.string()
    .valid('tenant_admin', 'finance', 'operations')
    .required()
    .messages({
      'any.only': 'Rol inválido. Valores permitidos: tenant_admin, finance, operations',
      'any.required': 'El rol es requerido'
    }),
  permissions: Joi.array()
    .items(
      Joi.string().valid(
        'manage_events',
        'manage_tickets',
        'view_reports',
        'manage_users',
        'validate_tickets'
      )
    )
    .optional()
});

const updateUserSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional(),
  role: Joi.string()
    .valid('tenant_admin', 'finance', 'operations')
    .optional(),
  permissions: Joi.array()
    .items(
      Joi.string().valid(
        'manage_events',
        'manage_tickets',
        'view_reports',
        'manage_users',
        'validate_tickets'
      )
    )
    .optional(),
  isActive: Joi.boolean().optional()
});

/**
 * Middleware to validate request body against schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  createTenantSchema,
  updateTenantSchema,
  createTenantAdminSchema,
  createEventSchema,
  updateEventSchema,
  createUserSchema,
  updateUserSchema,
  validate
};
