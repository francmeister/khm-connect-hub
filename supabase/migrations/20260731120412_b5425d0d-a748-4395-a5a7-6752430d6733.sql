UPDATE public.newsletters SET
  title='How We Work Will Define What We Achieve',
  slug='how-we-work-will-define-what-we-achieve-march-2026',
  description='This edition focuses on company culture, moving from execution to product excellence, and embracing speed. The CEO discusses the essential role of AI in the future of work and announces an upcoming Innovation Challenge. Includes regional updates from YellowDot and PISI.',
  categories=ARRAY['Company Culture','Business Strategy','Technology','Performance Updates']::text[],
  keywords=ARRAY['CEO Message','Product-First','Execution','AI Strategy','YellowDot','PISI','Innovation Challenge','Corporate Ethos']::text[],
  tech_spotlight_title='AI, Agents, and the Future of How We Work',
  tech_spotlight_description='AI and intelligent agents are now an essential, non-optional part of daily routines. This technology will fundamentally change how KHM builds products, serves customers, and operates internally. A clear strategy and deployment roadmap is a top, immediate priority.',
  cover_image_path='2026/d3cd8cd6-4605-47da-b449-7cc9597222a7.png',
  updated_at=now()
WHERE id='1276b51f-8493-49c8-8097-787edbc1e9e1';

UPDATE public.newsletters SET
  title='Back to the Basics: Done Well, Every Day',
  slug='back-to-the-basics-done-well-every-day-april-2026',
  description='This edition focuses on executing the basics with consistency. We review Q2 momentum across business units, including new partnerships and service launches for YellowDot and YDPay, alongside updates on the refreshed KHM Innovation Challenge for employees.',
  categories=ARRAY['Corporate Strategy','Business Performance','Product Innovation']::text[],
  keywords=ARRAY['Execution','Momentum','YellowDot','YDPay','PISI','MTN','Growth','Innovation Challenge']::text[],
  tech_spotlight_title='YDPay Update: Fintech Product Launches',
  tech_spotlight_description='YDPay successfully launched virtual USD Visa & Mastercard cards and a new referral program. The YDCredit salary-backed loan pilot is active, with progress also being made on the required moneylenders licence.',
  cover_image_path='2026/6585911f-5abd-4023-aa87-e67d88bbdb1d.png',
  updated_at=now()
WHERE id='aee2df58-c55f-4e4f-92f3-f79962fa68b2';

UPDATE public.newsletters SET
  title='Momentum, Structure and Building for Scale',
  slug='momentum-structure-and-building-for-scale-may-2026',
  description='The CEO''s message focuses on execution, ownership, and scaling the organization. This edition welcomes a new Group Head of Marketing and provides operational updates from business units across various regions, detailing recent successes, challenges, and new product launches.',
  categories=ARRAY['Corporate Strategy','Business Performance','Leadership','Employee News']::text[],
  keywords=ARRAY['Execution','Operating Model','Product-First','Business Unit Updates','Marketing','YellowDot','Shalamar Zandamela','Leadership']::text[],
  tech_spotlight_title=NULL,
  tech_spotlight_description=NULL,
  cover_image_path='2026/e7e60df3-476a-4d69-9f61-1cf06cdb0920.png',
  updated_at=now()
WHERE id='a75d1738-3351-44e3-97b6-41d8f3af0b47';

UPDATE public.newsletters SET
  title='From Activity to Impact: The Next Chapter for KHM',
  slug='from-activity-to-impact-the-next-chapter-for-khm-june-2026',
  description='This edition features a message from the CEO on shifting the company''s focus from activity to meaningful impact and the upcoming rollout of Agentic AI. It also covers key business unit updates, regional challenges, and an HR announcement about a company-wide Innovation Challenge.',
  categories=ARRAY['Corporate Strategy','Technology & Innovation','Business Updates','Company Culture']::text[],
  keywords=ARRAY['CEO Message','Agentic AI','Transformation','Business Units','Yellow Dot','PISI','YDPay','Innovation Challenge']::text[],
  tech_spotlight_title='Agentic AI Capability Rollout',
  tech_spotlight_description='Our vision is for AI and intelligent agents to become trusted partners in our daily work, helping every team improve productivity, automate repetitive tasks, make better decisions and ultimately create more value for our customers.',
  cover_image_path='2026/6cafc3c3-eaa6-4c4b-8708-73bd5901825b.png',
  updated_at=now()
WHERE id='2784f9f7-174e-455b-99cd-b79e1eb399aa';