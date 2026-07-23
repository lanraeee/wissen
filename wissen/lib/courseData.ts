export interface QuizQuestion {
  question: string
  options: { a: string; b: string; c: string; d: string }
  correct: 'a' | 'b' | 'c' | 'd'
}

export interface Module {
  id: number
  title: string
  desc: string
  objectives: string[]
  summary: string
  quiz: QuizQuestion[]
}

export interface Course {
  id: string
  title: string
  tagline: string
  modules: Module[]
  certificateName: string
  isPremium: boolean
}

export const COURSES: Course[] = [
  {
    id: 'soft-skills',
    title: 'Soft Skills for the Modern Workplace',
    tagline: 'Master communication, teamwork, time management, problem-solving, adaptability, and professional branding.',
    isPremium: false,
    certificateName: 'Soft Skills for the Modern Workplace Certificate',
    modules: [
      {
        id: 1,
        title: 'Communication Skills',
        desc: 'Master the art of clear, empathetic communication in the workplace.',
        objectives: [
          'Communicate clearly in writing and verbally',
          'Practice active listening and ask clarifying questions',
          'Give and receive constructive feedback professionally'
        ],
        summary: 'Master the art of clear, empathetic communication—the foundation of all workplace relationships. Learn to express ideas concisely, listen actively, and handle difficult conversations with grace.',
        quiz: [
          {
            question: 'When writing a professional email about a problem, what should you always include?',
            options: {
              a: 'Just the problem without offering solutions',
              b: 'The specific issue, its impact, and concrete next steps',
              c: 'Emotional language to express how frustrated you are',
              d: 'A list of all past problems with this person'
            },
            correct: 'b'
          },
          {
            question: 'What is active listening?',
            options: {
              a: 'Staying quiet while someone talks',
              b: 'Fully focusing on the speaker, asking clarifying questions, and reflecting back what you heard',
              c: 'Thinking about your response while they speak',
              d: 'Taking detailed notes without making eye contact'
            },
            correct: 'b'
          },
          {
            question: 'When giving constructive feedback, you should focus on:',
            options: {
              a: "The person's character and personality",
              b: 'Specific behaviors and their impact, with suggestions for improvement',
              c: 'Criticism disguised as jokes',
              d: 'Only pointing out mistakes without solutions'
            },
            correct: 'b'
          }
        ]
      },
      {
        id: 2,
        title: 'Teamwork & Collaboration',
        desc: 'Build trust and work effectively with others.',
        objectives: [
          'Contribute effectively to team goals',
          'Work respectfully across differences of opinion and background',
          'Navigate conflict and find win-win solutions'
        ],
        summary: "Great teams aren't built on talent alone—they're built on trust, respect, and shared purpose. Learn to collaborate across differences, support your teammates, and resolve conflicts constructively.",
        quiz: [
          {
            question: "When two teammates disagree on project approach, what's the best first step?",
            options: {
              a: 'Go with your idea and ignore theirs',
              b: 'Ask each person why their approach matters to them and listen for underlying concerns',
              c: 'Let the loudest person decide',
              d: 'Avoid the conflict entirely'
            },
            correct: 'b'
          },
          {
            question: "In a remote team setting, what's most important for collaboration?",
            options: {
              a: 'Only communicating through video calls',
              b: 'Clear documentation, regular check-ins, and respectful async communication',
              c: 'Working at the exact same time as everyone else',
              d: 'Assuming everyone works the same way you do'
            },
            correct: 'b'
          },
          {
            question: 'How should you handle a conflict with a teammate?',
            options: {
              a: 'Talk badly about them to other team members',
              b: 'Have a private conversation focused on solving the problem, not blaming',
              c: 'Ignore it and hope it goes away',
              d: 'Report them immediately without talking to them first'
            },
            correct: 'b'
          }
        ]
      },
      {
        id: 3,
        title: 'Time Management & Productivity',
        desc: 'Prioritize tasks and sustain peak performance.',
        objectives: [
          'Prioritize tasks using a clear framework',
          'Protect deep work time and minimize distractions',
          'Recognize burnout signs and practice sustainable productivity'
        ],
        summary: "Productivity isn't about doing more—it's about doing what matters most with intention. Learn proven prioritization methods, build focused work habits, and maintain balance to avoid burnout.",
        quiz: [
          {
            question: 'Which task should you prioritize first?',
            options: {
              a: 'Urgent AND Important (deadline today, affects goals)',
              b: 'Important but NOT Urgent (builds future success)',
              c: "Urgent but NOT Important (feels urgent but doesn't matter)",
              d: 'Neither urgent nor important (low-value busywork)'
            },
            correct: 'a'
          },
          {
            question: 'What is "deep work"?',
            options: {
              a: 'Working longer hours every day',
              b: 'Focused, distraction-free time on complex, important tasks',
              c: 'Multitasking to get more done',
              d: 'Responding to every message immediately'
            },
            correct: 'b'
          },
          {
            question: 'Early signs of burnout include:',
            options: {
              a: 'Feeling energized and excited',
              b: 'Chronic fatigue, loss of motivation, difficulty concentrating',
              c: 'Having clear work-life boundaries',
              d: 'Regular vacation time'
            },
            correct: 'b'
          }
        ]
      },
      {
        id: 4,
        title: 'Problem-Solving & Critical Thinking',
        desc: 'Break complex problems down and make informed decisions.',
        objectives: [
          'Break complex problems into manageable parts',
          'Identify root causes, not just symptoms',
          'Make informed decisions when facing uncertainty'
        ],
        summary: 'Every professional faces unexpected challenges. Develop a structured approach to problem-solving that moves beyond surface-level fixes to real, lasting solutions.',
        quiz: [
          {
            question: 'A course has 40% dropout. "Students aren\'t motivated" is a:',
            options: {
              a: 'Root cause (the real problem)',
              b: 'Symptom (surface observation, not the real cause)',
              c: 'Solution',
              d: 'Not relevant to the problem'
            },
            correct: 'b'
          },
          {
            question: 'The best way to find root cause is to:',
            options: {
              a: 'Assume the first explanation is correct',
              b: 'Ask "Why?" repeatedly to dig deeper: Why did it happen? Why did that happen?',
              c: 'Treat the symptom and hope it fixes the problem',
              d: 'Ignore the problem and move on'
            },
            correct: 'b'
          },
          {
            question: 'When making decisions under uncertainty, you should:',
            options: {
              a: 'Guess and hope for the best',
              b: 'Gather available information, consider options, and accept some risk',
              c: 'Wait until you have perfect information (which never comes)',
              d: 'Let others decide for you'
            },
            correct: 'b'
          }
        ]
      },
      {
        id: 5,
        title: 'Adaptability & Growth Mindset',
        desc: 'Embrace change and build mental resilience.',
        objectives: [
          'Embrace change as an opportunity to learn',
          'Extract lessons from failure without shame',
          'Stay resourceful when plans fall apart'
        ],
        summary: 'The only constant in modern work is change. Build mental resilience, adopt a growth mindset, and learn to see challenges as chances to develop new capabilities.',
        quiz: [
          {
            question: 'A growth mindset means believing:',
            options: {
              a: "Your abilities are fixed and can't change",
              b: 'You can develop new skills and abilities through effort and learning',
              c: 'Failure defines who you are permanently',
              d: 'Challenges are threats to avoid'
            },
            correct: 'b'
          },
          {
            question: 'When you fail at something, the most productive response is:',
            options: {
              a: "Give up because you're not good enough",
              b: 'Blame others for the failure',
              c: 'Analyze what went wrong, extract lessons, and try again differently',
              d: 'Pretend it never happened'
            },
            correct: 'c'
          },
          {
            question: 'How should you respond to unexpected change in your work?',
            options: {
              a: 'Resist it and hope things go back to normal',
              b: 'See it as an opportunity to learn new skills and adapt your approach',
              c: 'Panic and freeze',
              d: 'Blame the organization for the change'
            },
            correct: 'b'
          }
        ]
      },
      {
        id: 6,
        title: 'Professional Branding & Your Story',
        desc: 'Craft your narrative and build your professional presence.',
        objectives: [
          'Craft a compelling personal narrative',
          'Build and maintain a professional online presence',
          'Present yourself authentically in interviews and networking'
        ],
        summary: 'Your brand is how the world knows you. Learn to tell your story clearly, build a professional presence that reflects your values, and position yourself for opportunities.',
        quiz: [
          {
            question: 'Your professional brand should include:',
            options: {
              a: 'Only your job title and company',
              b: 'Your skills, values, unique perspective, and what you care about',
              c: 'Exaggerations about your achievements',
              d: 'Only technical skills, nothing personal'
            },
            correct: 'b'
          },
          {
            question: 'When networking or interviewing, you should:',
            options: {
              a: 'Tell a generic story that applies to everyone',
              b: 'Share a specific story that shows your skills and values authentically',
              c: 'Never mention personal experiences',
              d: "Pretend to be someone you're not"
            },
            correct: 'b'
          },
          {
            question: 'Your LinkedIn profile should:',
            options: {
              a: 'Be outdated and rarely updated',
              b: "Reflect your professional identity, accomplishments, and what you're working toward",
              c: "Copy someone else's profile exactly",
              d: 'Only list job titles without context'
            },
            correct: 'b'
          }
        ]
      }
    ]
  },

  {
    id: 'career-launch',
    title: 'Career Launch Blueprint',
    tagline: 'Everything you need to know before graduating. Learn CV writing, interviewing, networking, and build your 5-year plan.',
    isPremium: true,
    certificateName: 'Career Launch Blueprint Certificate',
    modules: [
      {
        id: 1,
        title: 'Crafting Your Professional Resume',
        desc: 'Create a resume that gets results.',
        objectives: ['Write a compelling CV tailored to each role', 'Choose the right format for your experience level', 'Quantify achievements to stand out'],
        summary: 'Your resume is your first impression. Learn to write a compelling, ATS-friendly CV that gets you through the door. Understand how to highlight achievements over duties and tailor your resume to each opportunity.',
        quiz: [
          {
            question: 'What should you focus on in each bullet point of your CV?',
            options: { a: 'Job duties and responsibilities only', b: 'Quantified achievements and impact', c: 'Personal opinions about the role', d: 'A description of the company' },
            correct: 'b'
          },
          {
            question: 'What does ATS stand for?',
            options: { a: 'Applicant Tracking System', b: 'Advanced Template Software', c: 'Automated Text Scanner', d: 'Application Test Suite' },
            correct: 'a'
          },
          {
            question: 'How long should a recent graduate\'s CV typically be?',
            options: { a: 'As long as needed to include everything', b: '1-2 pages maximum', c: 'At least 5 pages', d: 'Exactly 3 pages' },
            correct: 'b'
          }
        ]
      },
      {
        id: 2,
        title: 'Mastering the Interview Process',
        desc: 'Strategies to stand out and land the job.',
        objectives: ['Prepare compelling answers using the STAR method', 'Research companies effectively before interviews', 'Handle tough questions with confidence'],
        summary: 'Interviews are a learnable skill. Master the STAR method, learn how to research companies, prepare smart questions to ask, and follow up effectively to leave a lasting impression.',
        quiz: [
          {
            question: 'What does STAR stand for in interview preparation?',
            options: { a: 'Skills, Talents, Abilities, Results', b: 'Situation, Task, Action, Result', c: 'Story, Theme, Answer, Response', d: 'Strong, Targeted, Articulate, Ready' },
            correct: 'b'
          },
          {
            question: 'When should you research a company before an interview?',
            options: { a: 'In the waiting room before the interview', b: 'Thoroughly beforehand, including their products, mission, and recent news', c: 'Only if you are very interested', d: 'You do not need to research at all' },
            correct: 'b'
          },
          {
            question: 'After a job interview, you should:',
            options: { a: 'Wait passively and hope for the best', b: 'Send a thank-you note within 24 hours', c: 'Call the recruiter every day', d: 'Post about the interview on social media' },
            correct: 'b'
          }
        ]
      },
      {
        id: 3,
        title: 'Networking Like a Pro',
        desc: 'Build genuine professional relationships.',
        objectives: ['Build authentic professional connections', 'Use LinkedIn effectively for networking', 'Follow up and maintain your network'],
        summary: 'Networking is not about collecting contacts—it is about building genuine relationships. Learn to reach out authentically, add value to others, leverage LinkedIn, and maintain your network over time.',
        quiz: [
          {
            question: 'The most effective networking approach is:',
            options: { a: 'Collecting as many business cards as possible', b: 'Building genuine relationships by offering value and showing interest', c: 'Only networking when you need a job', d: 'Sending mass connection requests on LinkedIn' },
            correct: 'b'
          },
          {
            question: 'When reaching out to someone on LinkedIn, your message should:',
            options: { a: 'Immediately ask for a job or favour', b: 'Be personalized, mention a connection point, and offer something of value', c: 'Be copied from a template', d: 'Only include your CV' },
            correct: 'b'
          },
          {
            question: 'How often should you engage with your professional network?',
            options: { a: 'Only when you need something from them', b: 'Regularly, even when you do not need anything', c: 'Never initiate contact', d: 'Once a year' },
            correct: 'b'
          }
        ]
      },
      {
        id: 4,
        title: 'Salary Negotiation Essentials',
        desc: 'Know your worth and negotiate confidently.',
        objectives: ['Research market salaries before negotiating', 'Confidently state and justify your ask', 'Navigate counter-offers and equity discussions'],
        summary: 'Negotiating your salary is one of the highest-ROI activities in your career. Learn to research market rates, time your ask correctly, and confidently advocate for your worth without burning bridges.',
        quiz: [
          {
            question: 'When should you bring up salary in an interview process?',
            options: { a: 'In the very first interview', b: 'Only after you have received a written offer', c: 'Never—let the employer always go first', d: 'It does not matter when you bring it up' },
            correct: 'b'
          },
          {
            question: 'When researching your salary range, what sources are most useful?',
            options: { a: 'What your friends earn', b: 'Glassdoor, LinkedIn Salary, and industry reports', c: 'What you think you deserve', d: 'Only the job description' },
            correct: 'b'
          },
          {
            question: 'If an offer comes in below your expectations, you should:',
            options: { a: 'Accept immediately to avoid seeming difficult', b: 'Politely counter with a justified ask based on your research', c: 'Reject the offer without discussion', d: 'Never negotiate—it is rude' },
            correct: 'b'
          }
        ]
      },
      {
        id: 5,
        title: 'Building Your Personal Brand',
        desc: 'Tell your story across platforms.',
        objectives: ['Define your unique professional identity', 'Build a compelling LinkedIn profile', 'Create content that demonstrates your expertise'],
        summary: 'Your personal brand is your professional reputation—and it exists whether you manage it or not. Learn to define your unique value proposition, optimize your digital presence, and consistently communicate your story.',
        quiz: [
          {
            question: 'Your personal brand is primarily about:',
            options: { a: 'Creating a fake persona online', b: 'How others perceive your professional value and unique contributions', c: 'The number of followers you have', d: 'Your job title only' },
            correct: 'b'
          },
          {
            question: 'Which element is most important for your LinkedIn profile?',
            options: { a: 'A glamorous profile photo', b: 'A compelling headline and summary that communicates your value', c: 'Listing every job you have ever had', d: 'Endorsements from strangers' },
            correct: 'b'
          },
          {
            question: 'Creating content in your area of expertise helps you:',
            options: { a: 'Waste time that could be spent on real work', b: 'Build credibility, attract opportunities, and grow your network', c: 'Only entertain people', d: 'Nothing—content does not matter for careers' },
            correct: 'b'
          }
        ]
      },
      {
        id: 6,
        title: 'Understanding Workplace Culture',
        desc: 'Navigate company dynamics successfully.',
        objectives: ['Read and adapt to workplace culture quickly', 'Build relationships with colleagues and managers', 'Navigate office politics professionally'],
        summary: 'Culture fit is as important as skill fit. Learn to observe and adapt to workplace norms, build key relationships from day one, and navigate office dynamics without compromising your values.',
        quiz: [
          {
            question: 'How do you best learn about a company\'s culture?',
            options: { a: 'Only from their website', b: 'By observing, asking questions, and talking to current employees', c: 'From their job advertisements', d: 'Culture does not matter if the pay is good' },
            correct: 'b'
          },
          {
            question: 'When starting a new job, what should you prioritize in your first 30 days?',
            options: { a: 'Immediately proposing major changes', b: 'Listening, learning, and building relationships before suggesting changes', c: 'Proving you know more than your colleagues', d: 'Keeping to yourself and focusing only on tasks' },
            correct: 'b'
          },
          {
            question: 'Office politics is best handled by:',
            options: { a: 'Avoiding all relationships at work', b: 'Building genuine alliances, being consistent, and staying focused on work', c: 'Gossiping to build alliances', d: 'Complaining openly about colleagues' },
            correct: 'b'
          }
        ]
      },
      {
        id: 7,
        title: 'Developing Your 5-Year Plan',
        desc: 'Set goals and create a roadmap to achieve them.',
        objectives: ['Define your short and long-term career goals', 'Identify skills gaps and how to close them', 'Create an actionable career roadmap'],
        summary: 'Success does not happen by accident. Build a realistic 5-year career plan that aligns your values and strengths with market opportunities—and learn to adapt it as you grow.',
        quiz: [
          {
            question: 'A 5-year career plan should be:',
            options: { a: 'Rigid and never change', b: 'A directional guide that is reviewed and updated regularly', c: 'So vague it is meaningless', d: 'Only about salary milestones' },
            correct: 'b'
          },
          {
            question: 'The first step in creating a career plan is:',
            options: { a: 'Deciding on a specific job title', b: 'Clarifying your values, strengths, and what you want from your career', c: 'Copying someone else\'s plan', d: 'Looking at what pays the most' },
            correct: 'b'
          },
          {
            question: 'How do you identify skills you need to develop?',
            options: { a: 'By guessing', b: 'By comparing your current skills against requirements for your target roles', c: 'Skills gaps do not matter if you work hard', d: 'By waiting for your manager to tell you' },
            correct: 'b'
          }
        ]
      },
      {
        id: 8,
        title: 'Remote Work Skills & Setup',
        desc: 'Thrive in the distributed workplace.',
        objectives: ['Set up an effective remote work environment', 'Communicate clearly in async settings', 'Maintain productivity and avoid isolation'],
        summary: 'Remote work is now a permanent feature of the modern workplace. Learn to create a productive home setup, communicate effectively across time zones, maintain visibility, and protect your wellbeing.',
        quiz: [
          {
            question: 'What is the most important skill for remote work?',
            options: { a: 'Being online 24/7', b: 'Clear, proactive, and documented communication', c: 'Working in isolation without talking to anyone', d: 'Having the fastest internet' },
            correct: 'b'
          },
          {
            question: 'How do you stay visible when working remotely?',
            options: { a: 'Send constant messages to show you are working', b: 'Provide regular updates, share wins, and actively participate in team discussions', c: 'Visibility does not matter when remote', d: 'Only speak when spoken to' },
            correct: 'b'
          },
          {
            question: 'To avoid isolation when working remotely, you should:',
            options: { a: 'Work longer hours to compensate', b: 'Schedule regular social check-ins, join virtual communities, and leave your workspace sometimes', c: 'Isolate completely and only communicate via email', d: 'Move back to the office' },
            correct: 'b'
          }
        ]
      },
      {
        id: 9,
        title: 'Managing Offers & Making Decisions',
        desc: 'Evaluate opportunities and choose wisely.',
        objectives: ['Evaluate job offers holistically beyond salary', 'Compare multiple offers objectively', 'Handle offer deadlines and declines professionally'],
        summary: 'Choosing the right opportunity is one of the most impactful career decisions you will make. Learn to evaluate offers across salary, growth, culture, and alignment—not just pay.',
        quiz: [
          {
            question: 'When evaluating a job offer, salary should be:',
            options: { a: 'The only consideration', b: 'One of many factors including growth, culture, and alignment', c: 'Ignored completely', d: 'The least important factor' },
            correct: 'b'
          },
          {
            question: 'If you have multiple offers, the best approach is:',
            options: { a: 'Accept the first one to avoid overthinking', b: 'Compare objectively using a clear framework of your priorities', c: 'Go with whoever calls most', d: 'Randomly decide' },
            correct: 'b'
          },
          {
            question: 'When declining an offer, you should:',
            options: { a: 'Simply disappear and stop responding', b: 'Decline politely and professionally, leaving the door open for the future', c: 'Explain all the negatives about their company', d: 'Ask for more time indefinitely' },
            correct: 'b'
          }
        ]
      },
      {
        id: 10,
        title: 'Your First 100 Days on the Job',
        desc: 'Strategies to start strong and build confidence.',
        objectives: ['Make a strong first impression in your new role', 'Build key relationships in your first 30 days', 'Deliver early wins to establish credibility'],
        summary: 'The first 100 days set the tone for your entire tenure. Learn the proven strategies for ramping up quickly, building trust with your team, and delivering early wins without overstepping.',
        quiz: [
          {
            question: 'In your first 30 days at a new job, you should primarily:',
            options: { a: 'Immediately redesign all the processes', b: 'Listen, learn, and build relationships before taking action', c: 'Work longer than everyone else to prove yourself', d: 'Keep to yourself and stay focused on tasks only' },
            correct: 'b'
          },
          {
            question: 'What is an "early win" in a new job?',
            options: { a: 'Getting promoted in the first month', b: 'A small, visible accomplishment that demonstrates your competence and value', c: 'Working weekends', d: 'Outperforming your senior colleagues immediately' },
            correct: 'b'
          },
          {
            question: 'How often should you check in with your manager in your first 100 days?',
            options: { a: 'Never—they are too busy', b: 'Regularly, with prepared updates and specific questions', c: 'Only when things go wrong', d: 'Every hour to show commitment' },
            correct: 'b'
          }
        ]
      }
    ]
  },

  {
    id: 'ai',
    title: 'AI for Students & Young Professionals',
    tagline: 'Learn how to work smarter with AI. Master ChatGPT, prompt engineering, and build your AI workflow.',
    isPremium: true,
    certificateName: 'AI for Students & Young Professionals Certificate',
    modules: [
      {
        id: 1,
        title: 'Introduction to AI & Large Language Models',
        desc: 'Understand how ChatGPT and AI work.',
        objectives: ['Understand how large language models work', 'Identify key AI tools available today', 'Recognise the limitations and strengths of AI'],
        summary: 'Artificial intelligence is transforming every industry. This module explains how large language models like ChatGPT work, what they can and cannot do, and why understanding AI is now an essential career skill.',
        quiz: [
          {
            question: 'What is a Large Language Model (LLM)?',
            options: { a: 'A database of facts', b: 'An AI trained on vast amounts of text to predict and generate language', c: 'A search engine', d: 'A robot that understands human speech' },
            correct: 'b'
          },
          {
            question: 'Which of the following is a key limitation of current AI tools?',
            options: { a: 'They cannot process text quickly', b: 'They can confidently generate incorrect information (hallucinations)', c: 'They are too slow to be useful', d: 'They cannot understand English' },
            correct: 'b'
          },
          {
            question: 'AI tools are most useful when you use them to:',
            options: { a: 'Replace all human thinking entirely', b: 'Augment and accelerate your own work and ideas', c: 'Submit work without reviewing it', d: 'Avoid learning new skills' },
            correct: 'b'
          }
        ]
      },
      {
        id: 2,
        title: 'Prompt Engineering Fundamentals',
        desc: 'Craft prompts that get you better results.',
        objectives: ['Write clear and specific prompts', 'Use context and examples to improve AI outputs', 'Iterate prompts to refine results'],
        summary: 'The quality of your AI output depends entirely on the quality of your prompt. Learn the principles of effective prompting, how to provide context, use examples, and iterate to get exactly what you need.',
        quiz: [
          {
            question: 'What is "prompt engineering"?',
            options: { a: 'Building AI software', b: 'Crafting effective instructions for AI to produce useful outputs', c: 'Engineering new prompts from scratch', d: 'A job title at AI companies' },
            correct: 'b'
          },
          {
            question: 'Which prompt is likely to produce the best result?',
            options: { a: '"Write something"', b: '"Write a 500-word LinkedIn post about remote work for Nigerian professionals, using a professional but conversational tone"', c: '"LinkedIn post"', d: '"Make it good"' },
            correct: 'b'
          },
          {
            question: 'When an AI gives you a weak answer, the best approach is:',
            options: { a: 'Give up and do it manually', b: 'Refine your prompt with more context, constraints, or examples', c: 'Accept the weak answer', d: 'Try a different topic entirely' },
            correct: 'b'
          }
        ]
      },
      {
        id: 3,
        title: 'AI for Writing & Communication',
        desc: 'Draft, edit, and polish with AI assistance.',
        objectives: ['Use AI to draft and improve written work', 'Maintain your authentic voice while using AI', 'Edit and fact-check AI-generated content'],
        summary: 'AI can dramatically accelerate your writing—from emails to reports to social media posts. Learn how to collaborate with AI to produce polished content faster, while maintaining your own voice and always reviewing for accuracy.',
        quiz: [
          {
            question: 'When using AI for professional writing, you should always:',
            options: { a: 'Submit the AI output without changes', b: 'Review, edit, and add your personal voice before submitting', c: 'Use AI for everything and never write yourself', d: 'Ignore AI because it makes mistakes' },
            correct: 'b'
          },
          {
            question: 'AI writing tools are most useful for:',
            options: { a: 'Replacing all human writing permanently', b: 'Generating drafts, overcoming writer\'s block, and improving existing text', c: 'Publishing content without review', d: 'Writing your academic thesis' },
            correct: 'b'
          },
          {
            question: 'To maintain your authentic voice in AI-assisted writing:',
            options: { a: 'Use the AI output exactly as written', b: 'Edit the AI draft to match your tone, add specific details, and personalise it', c: 'Ask the AI to sound like you without giving any examples', d: 'Only use AI for grammar checking' },
            correct: 'b'
          }
        ]
      },
      {
        id: 4,
        title: 'AI for Research & Learning',
        desc: 'Find answers and learn faster with AI tools.',
        objectives: ['Use AI to accelerate research tasks', 'Verify and cross-check AI-provided information', 'Learn new topics faster with AI as a tutor'],
        summary: 'AI is a powerful learning accelerator. Use it to explain complex topics, generate study materials, summarise long documents, and explore new fields—while always verifying facts from primary sources.',
        quiz: [
          {
            question: 'When using AI for research, the most important rule is:',
            options: { a: 'Trust everything the AI says completely', b: 'Always verify important facts from authoritative primary sources', c: 'Use AI as your only source', d: 'Avoid AI for research entirely' },
            correct: 'b'
          },
          {
            question: 'AI tools are particularly useful for learning because they can:',
            options: { a: 'Replace textbooks and universities entirely', b: 'Explain concepts at your level, answer follow-up questions, and generate practice problems', c: 'Give you perfect information instantly', d: 'Guarantee you will pass exams' },
            correct: 'b'
          },
          {
            question: 'When summarising a long document with AI, you should:',
            options: { a: 'Trust the summary without reading the original', b: 'Review the original to ensure key points have not been missed or distorted', c: 'Only summarise documents under 1 page', d: 'Use the summary for citation purposes' },
            correct: 'b'
          }
        ]
      },
      {
        id: 5,
        title: 'AI for Coding & Technical Work',
        desc: 'Use GitHub Copilot and AI coding assistants.',
        objectives: ['Use AI to write and debug code', 'Leverage tools like GitHub Copilot effectively', 'Understand limitations of AI-generated code'],
        summary: 'AI coding assistants have transformed software development. Learn how to use GitHub Copilot, ChatGPT, and similar tools to write, debug, and understand code—while maintaining the skills to review and improve AI outputs.',
        quiz: [
          {
            question: 'When AI generates code for you, you should:',
            options: { a: 'Copy it directly into production without review', b: 'Review, test, and understand the code before using it', c: 'Assume it is always correct', d: 'Only use AI for documentation' },
            correct: 'b'
          },
          {
            question: 'AI coding assistants are most useful for:',
            options: { a: 'Replacing the need to learn programming', b: 'Accelerating coding tasks, suggesting completions, and explaining unfamiliar code', c: 'Writing perfect, bug-free code automatically', d: 'Only writing simple scripts' },
            correct: 'b'
          },
          {
            question: 'What is the risk of relying entirely on AI for coding?',
            options: { a: 'AI makes code too efficient', b: 'You may not develop the fundamental skills to debug or extend the code', c: 'AI code runs too fast', d: 'There is no risk—AI is perfect' },
            correct: 'b'
          }
        ]
      },
      {
        id: 6,
        title: 'AI for Data Analysis & Visualization',
        desc: 'Analyze data and create insights with AI.',
        objectives: ['Use AI to analyse datasets and identify patterns', 'Generate charts and visualisations with AI assistance', 'Interpret AI-generated data insights critically'],
        summary: 'Data is the new oil—and AI makes it far more accessible. Learn to use AI tools to clean data, run analysis, generate visualisations, and extract meaningful insights without being an expert data scientist.',
        quiz: [
          {
            question: 'AI data analysis tools are useful for people who:',
            options: { a: 'Only have PhDs in data science', b: 'Want to understand and act on data without needing deep technical expertise', c: 'Only use Excel', d: 'Do not have any data to analyse' },
            correct: 'b'
          },
          {
            question: 'When AI identifies a trend in your data, you should:',
            options: { a: 'Accept it as fact and act immediately', b: 'Consider context, check for anomalies, and validate with domain knowledge', c: 'Ignore AI insights entirely', d: 'Only trust human analysis' },
            correct: 'b'
          },
          {
            question: 'What should you consider before sharing AI-generated charts?',
            options: { a: 'Nothing—AI charts are always accurate', b: 'Whether the data is accurate, the visualisation is appropriate, and labels are clear', c: 'Only the visual design', d: 'Only the colour scheme' },
            correct: 'b'
          }
        ]
      },
      {
        id: 7,
        title: 'AI for Creative Projects',
        desc: 'Generate ideas, images, and content.',
        objectives: ['Use AI to generate and iterate creative ideas', 'Create images and media with AI tools', 'Maintain creative originality when using AI'],
        summary: 'AI is a creative co-pilot. Learn to use AI image generators, writing tools, and ideation assistants to accelerate your creative projects—while ensuring the final work reflects your vision and voice.',
        quiz: [
          {
            question: 'AI is most valuable in creative work when used as:',
            options: { a: 'The sole creator of all content', b: 'A collaborative tool that helps you explore ideas and overcome creative blocks', c: 'A replacement for your creative input', d: 'Only for backgrounds and filler content' },
            correct: 'b'
          },
          {
            question: 'When using AI-generated images professionally, you should:',
            options: { a: 'Use them without modification or attribution', b: 'Consider copyright issues, disclosure requirements, and whether they meet your quality standards', c: 'Only use them for personal projects', d: 'Always claim you made them yourself' },
            correct: 'b'
          },
          {
            question: 'To get the best creative output from AI, you should:',
            options: { a: 'Give vague instructions and hope for the best', b: 'Provide detailed creative briefs, style references, and iterate on the results', c: 'Accept the first output always', d: 'Never give specific instructions' },
            correct: 'b'
          }
        ]
      },
      {
        id: 8,
        title: 'AI Ethics & Responsible Use',
        desc: 'Use AI ethically and understand the risks.',
        objectives: ['Understand key AI ethics principles', 'Recognise bias and fairness issues in AI', 'Use AI responsibly in professional contexts'],
        summary: 'With great power comes great responsibility. Understand the ethical dimensions of AI—bias, privacy, misinformation, and accountability—and develop habits for responsible, transparent AI use.',
        quiz: [
          {
            question: 'AI bias occurs when:',
            options: { a: 'AI prefers certain programming languages', b: 'Training data reflects existing societal biases, causing unfair outputs for some groups', c: 'AI runs too slowly', d: 'Users disagree with AI answers' },
            correct: 'b'
          },
          {
            question: 'When using AI at work, transparency means:',
            options: { a: 'Never telling anyone you use AI', b: 'Disclosing AI use appropriately and being honest about the extent of AI assistance', c: 'Claiming all AI work as entirely your own', d: 'Using AI only for personal tasks' },
            correct: 'b'
          },
          {
            question: 'AI-generated misinformation is dangerous because:',
            options: { a: 'AI is always right so misinformation is impossible', b: 'AI can produce convincing, authoritative-sounding false information at scale', c: 'It only affects technical fields', d: 'It is easy to detect visually' },
            correct: 'b'
          }
        ]
      },
      {
        id: 9,
        title: 'Building Your AI Workflow',
        desc: 'Integrate AI tools into your daily work.',
        objectives: ['Identify tasks where AI can save you the most time', 'Build consistent AI-assisted workflows', 'Evaluate and adopt new AI tools effectively'],
        summary: 'AI is only valuable if it is integrated into how you actually work. Design a personalised AI workflow that fits your role, saves you time on low-value tasks, and frees you for high-value thinking.',
        quiz: [
          {
            question: 'The best way to start integrating AI into your work is:',
            options: { a: 'Replace all your current tools immediately', b: 'Identify specific repetitive tasks where AI can save time, and start there', c: 'Use AI for everything without evaluation', d: 'Wait until AI is perfect' },
            correct: 'b'
          },
          {
            question: 'When evaluating a new AI tool, you should:',
            options: { a: 'Use it on your most critical project immediately', b: 'Test it on low-stakes tasks first and evaluate output quality before relying on it', c: 'Trust the marketing claims entirely', d: 'Avoid new tools—stick to what you know' },
            correct: 'b'
          },
          {
            question: 'A good AI workflow should help you:',
            options: { a: 'Eliminate all human effort from your work', b: 'Focus more of your time on high-value, creative, and strategic tasks', c: 'Work fewer hours without producing results', d: 'Automate your thinking entirely' },
            correct: 'b'
          }
        ]
      },
      {
        id: 10,
        title: 'The Future of Work & AI Careers',
        desc: 'Stay ahead as AI reshapes industries.',
        objectives: ['Understand how AI is reshaping the job market', 'Identify skills that will remain valuable in an AI world', 'Position yourself for AI-era career opportunities'],
        summary: 'AI is not taking jobs—it is changing them. Learn which skills will remain irreplaceable, how to position yourself for the AI economy, and how to keep learning as the landscape evolves.',
        quiz: [
          {
            question: 'Which skills will be most valuable in an AI-driven workplace?',
            options: { a: 'Tasks AI can fully automate like data entry', b: 'Critical thinking, creativity, emotional intelligence, and complex problem-solving', c: 'Knowing how to type quickly', d: 'Only technical programming skills' },
            correct: 'b'
          },
          {
            question: 'How should you respond to AI tools entering your industry?',
            options: { a: 'Refuse to use them and hope they go away', b: 'Learn to use AI tools to augment your skills and increase your competitive advantage', c: 'Wait for your employer to train you', d: 'Look for a different industry' },
            correct: 'b'
          },
          {
            question: 'The best career strategy for an AI world is:',
            options: { a: 'Specialise in one tool and never change', b: 'Develop strong foundational skills and a habit of continuous learning', c: 'Become an AI engineer regardless of your interests', d: 'Avoid technology in your career' },
            correct: 'b'
          }
        ]
      }
    ]
  },

  {
    id: 'financial-literacy',
    title: 'Financial Literacy for Young Adults',
    tagline: 'Make your first salary count. Master budgeting, saving, investing, and personal finance habits.',
    isPremium: true,
    certificateName: 'Financial Literacy Certificate',
    modules: [
      { id: 1, title: 'Money Mindset & Financial Foundations', desc: 'Develop a healthy relationship with money.', objectives: ['Identify limiting beliefs about money', 'Build positive financial habits', 'Understand key financial concepts'], summary: 'Your money mindset shapes every financial decision you make. Learn to identify limiting beliefs, develop healthy financial habits, and build the foundation for long-term wealth.', quiz: [{ question: 'A healthy money mindset involves:', options: { a: 'Avoiding all thought about money', b: 'Viewing money as a tool that can be learned and managed', c: 'Believing wealth is only for the lucky', d: 'Spending everything you earn immediately' }, correct: 'b' }, { question: 'The first step to financial health is:', options: { a: 'Investing in stocks immediately', b: 'Understanding your current income, expenses, and financial goals', c: 'Earning more money', d: 'Ignoring your finances and hoping for the best' }, correct: 'b' }, { question: 'Financial literacy is important because:', options: { a: 'Only accountants need to understand money', b: 'Understanding money helps you make better decisions that build long-term security', c: 'Banks will manage everything for you', d: 'Money knowledge is built in from birth' }, correct: 'b' }] },
      { id: 2, title: 'Creating Your First Budget', desc: 'Track income and expenses effectively.', objectives: ['Build a simple monthly budget', 'Track spending categories', 'Identify areas to cut costs'], summary: 'A budget is not a restriction—it is a plan for your money. Learn to create a realistic budget that reflects your priorities, track your spending, and adjust as your life changes.', quiz: [{ question: 'The 50/30/20 budget rule splits income into:', options: { a: 'Savings, investing, spending', b: 'Needs (50%), wants (30%), and savings/debt (20%)', c: 'Rent, food, everything else', d: 'Business, personal, government' }, correct: 'b' }, { question: 'The most important reason to track your spending is:', options: { a: 'To feel guilty about what you spend', b: 'To understand where your money goes and make intentional choices', c: 'To impress others with your discipline', d: 'Tracking is not important' }, correct: 'b' }, { question: 'When your expenses exceed your income, you should:', options: { a: 'Ignore the problem', b: 'Identify non-essential spending to cut and look for ways to increase income', c: 'Borrow to make up the difference', d: 'Stop making a budget' }, correct: 'b' }] },
      { id: 3, title: 'Managing Your First Salary', desc: 'Make smart decisions with your earnings.', objectives: ['Allocate your first salary wisely', 'Avoid common first-salary mistakes', 'Build good financial habits from day one'], summary: 'Your first salary is a turning point. The habits you build now will compound over your career. Learn to allocate wisely, avoid lifestyle inflation, and start building wealth from your very first paycheck.', quiz: [{ question: 'Lifestyle inflation means:', options: { a: 'Prices going up over time', b: 'Increasing your spending as your income increases, preventing wealth accumulation', c: 'A government economic term', d: 'Improving your quality of life wisely' }, correct: 'b' }, { question: 'The best time to start saving is:', options: { a: 'When you earn your first large salary', b: 'Now, regardless of how small the amount', c: 'After you have paid all your debts', d: 'In your 40s when you have more money' }, correct: 'b' }, { question: 'Before spending your first salary, you should:', options: { a: 'Buy something nice to celebrate', b: 'Pay yourself first by setting aside savings before other expenses', c: 'Wait to see what is left at the end of the month', d: 'Ask your parents what to do' }, correct: 'b' }] },
      { id: 4, title: 'Understanding Debt & Credit', desc: 'Use credit wisely and build your score.', objectives: ['Understand good vs. bad debt', 'Build and protect your credit score', 'Manage debt repayment strategically'], summary: 'Not all debt is bad—but all debt has a cost. Learn to distinguish productive from destructive debt, build your credit score, and develop a strategic approach to paying off what you owe.', quiz: [{ question: 'What is considered "good debt"?', options: { a: 'Any debt you can afford', b: 'Debt invested in assets that generate returns or increase your earning power', c: 'Credit card debt', d: 'All debt is bad' }, correct: 'b' }, { question: 'Your credit score is affected by:', options: { a: 'Your salary and job title', b: 'Payment history, credit utilisation, length of credit history, and account types', c: 'How much you have in savings', d: 'Where you went to school' }, correct: 'b' }, { question: 'The best debt repayment strategy is:', options: { a: 'Ignore minimum payments and focus on other goals', b: 'Pay more than the minimum on high-interest debt while maintaining others', c: 'Take out new debt to pay old debt', d: 'Only make minimum payments always' }, correct: 'b' }] },
      { id: 5, title: 'Emergency Funds & Savings Strategies', desc: 'Build financial security and resilience.', objectives: ['Build a 3-6 month emergency fund', 'Choose the right savings accounts', 'Automate your savings effectively'], summary: 'An emergency fund is your financial safety net. Learn how much to save, where to keep it, and how to automate your savings so that building security becomes effortless.', quiz: [{ question: 'An emergency fund should cover:', options: { a: 'One week of expenses', b: '3-6 months of essential living expenses', c: 'One month of salary', d: 'Whatever you can save' }, correct: 'b' }, { question: 'The best place to keep an emergency fund is:', options: { a: 'Invested in stocks for maximum growth', b: 'A liquid, accessible savings account separate from your daily spending account', c: 'Under your mattress', d: 'Locked in a long-term investment' }, correct: 'b' }, { question: 'The best way to consistently save money is:', options: { a: 'Save whatever is left at the end of the month', b: 'Automate transfers to savings on payday before you can spend it', c: 'Save only when you feel motivated', d: 'Rely on willpower alone' }, correct: 'b' }] },
      { id: 6, title: 'Investment Basics for Beginners', desc: 'Start investing and grow your wealth.', objectives: ['Understand key investment vehicles', 'Grasp risk vs. return trade-offs', 'Start investing with small amounts'], summary: 'Investing is how ordinary people build extraordinary wealth over time. Learn the fundamentals of stocks, bonds, and mutual funds, understand risk, and discover how compound interest works in your favour.', quiz: [{ question: 'The power of compound interest means:', options: { a: 'Your bank charges you more over time', b: 'Your returns generate their own returns, growing wealth exponentially', c: 'You earn more from complex investments', d: 'Interest compounds only in certain banks' }, correct: 'b' }, { question: 'Diversification in investing helps you:', options: { a: 'Guarantee maximum returns', b: 'Reduce risk by spreading investments across different assets', c: 'Only invest in one type of asset', d: 'Make investing more complicated' }, correct: 'b' }, { question: 'The best time to start investing is:', options: { a: 'When the stock market is at its lowest', b: 'As early as possible, even with small amounts', c: 'Only after you have ₦1 million saved', d: 'When you fully understand everything' }, correct: 'b' }] },
      { id: 7, title: 'Retirement Planning Starts Now', desc: 'Prepare for a secure financial future.', objectives: ['Understand why to start retirement planning early', 'Know your pension and retirement options in Nigeria', 'Calculate how much you need to retire'], summary: 'Retirement feels far away when you are young—but time is your most powerful asset. Learn why starting now matters enormously, understand Nigeria\'s pension system, and set simple retirement goals.', quiz: [{ question: 'Why should you start retirement planning in your 20s?', options: { a: 'Because it is a legal requirement', b: 'Because compound growth over decades turns small contributions into large savings', c: 'Because retirement happens sooner than you think', d: 'There is no benefit to starting early' }, correct: 'b' }, { question: 'Nigeria\'s Contributory Pension Scheme requires:', options: { a: 'Only self-employed workers to contribute', b: 'Employers and employees to both contribute to an approved pension fund', c: 'Only government employees to contribute', d: 'No contributions at all' }, correct: 'b' }, { question: 'Your retirement savings goal depends primarily on:', options: { a: 'What the government decides for you', b: 'Your expected retirement expenses, years in retirement, and investment returns', c: 'Only your current salary', d: 'The advice of a stranger' }, correct: 'b' }] },
      { id: 8, title: 'Insurance Essentials', desc: 'Protect yourself and your assets.', objectives: ['Understand key types of insurance', 'Assess what insurance you actually need', 'Avoid common insurance mistakes'], summary: 'Insurance is financial protection against catastrophic loss. Learn the types of insurance that matter—health, life, and property—and how to assess what you genuinely need without overpaying.', quiz: [{ question: 'Insurance works on the principle of:', options: { a: 'Making insurance companies rich', b: 'Pooling risk across many people so no individual faces catastrophic loss alone', c: 'Guaranteed payouts for everyone', d: 'Saving money for future expenses' }, correct: 'b' }, { question: 'Health insurance is important because:', options: { a: 'It is required by law everywhere', b: 'Medical emergencies can be financially devastating without coverage', c: 'You will definitely get sick', d: 'It is cheap and easy to afford out of pocket' }, correct: 'b' }, { question: 'When evaluating an insurance policy, you should check:', options: { a: 'Only the monthly premium', b: 'Coverage limits, exclusions, deductibles, and the reputation of the insurer', c: 'Only the brand name of the insurance company', d: 'Nothing—all policies are the same' }, correct: 'b' }] },
      { id: 9, title: 'Taxes & Financial Planning in Nigeria', desc: 'Navigate tax season and optimize taxes.', objectives: ['Understand personal income tax in Nigeria', 'File taxes correctly and on time', 'Identify legal tax deductions'], summary: 'Taxes are a reality of financial life. Learn how Nigeria\'s personal income tax system works, how to file correctly, and how to legally reduce your tax liability while staying fully compliant.', quiz: [{ question: 'In Nigeria, personal income tax is paid to:', options: { a: 'The Federal Inland Revenue Service (FIRS) for all workers', b: 'The state government where you reside, administered through PAYE for employees', c: 'No one—Nigeria has no income tax', d: 'Only self-employed people pay tax in Nigeria' }, correct: 'b' }, { question: 'A legal way to reduce your tax liability is:', options: { a: 'Hiding income from the government', b: 'Claiming eligible deductions like pension contributions and life insurance premiums', c: 'Not filing a tax return', d: 'Paying in cash to avoid records' }, correct: 'b' }, { question: 'Missing tax deadlines can result in:', options: { a: 'No consequences—the government does not monitor this', b: 'Fines, penalties, and potential legal issues', c: 'A tax refund', d: 'A lower tax bill' }, correct: 'b' }] },
      { id: 10, title: 'Building Long-Term Wealth', desc: 'Create lasting financial security.', objectives: ['Define what financial independence means to you', 'Build multiple income streams', 'Create a long-term wealth-building plan'], summary: 'Wealth is built systematically, not accidentally. Learn to think like a wealth builder—creating multiple income streams, investing consistently, and making deliberate choices that compound over decades into lasting financial security.', quiz: [{ question: 'Multiple income streams are important because:', options: { a: 'More jobs mean more stress', b: 'Diversifying income reduces financial risk and accelerates wealth building', c: 'Your salary should be enough', d: 'Side income is too complicated to manage' }, correct: 'b' }, { question: 'Long-term wealth is primarily built through:', options: { a: 'Winning the lottery', b: 'Consistent saving, investing, and reinvesting returns over many years', c: 'Getting a very high-paying job', d: 'Speculative investments and quick wins' }, correct: 'b' }, { question: 'Financial independence means:', options: { a: 'Being rich enough to spend without thinking', b: 'Having enough passive income and savings to cover your expenses without mandatory work', c: 'Inheriting money', d: 'Never needing to budget' }, correct: 'b' }] }
    ]
  },

  {
    id: 'workplace-readiness',
    title: 'Workplace Readiness',
    tagline: 'Thrive during your first five years at work. Master office dynamics, productivity, influence, and promotion strategies.',
    isPremium: true,
    certificateName: 'Workplace Readiness Certificate',
    modules: [
      { id: 1, title: 'Office Dynamics & Professional Etiquette', desc: 'Navigate workplace culture confidently.', objectives: ['Understand unwritten workplace rules', 'Present yourself professionally in all settings', 'Navigate office dynamics with confidence'], summary: 'Every workplace has written rules—and unwritten ones. Master professional etiquette, dress codes, meeting behaviour, and the subtle dynamics that separate thriving professionals from struggling ones.', quiz: [{ question: 'Professional etiquette in the workplace includes:', options: { a: 'Doing whatever you want as long as work gets done', b: 'Being punctual, respectful, and presenting yourself appropriately for the context', c: 'Only following rules you personally agree with', d: 'Copying exactly what your most successful colleague does' }, correct: 'b' }, { question: 'When unsure about workplace dress code, the best approach is:', options: { a: 'Dress however you feel', b: 'Dress one level more formal than you think is required until you understand the culture', c: 'Ask HR for a written policy', d: 'Match the most casually dressed person' }, correct: 'b' }, { question: 'Office "unwritten rules" typically include:', options: { a: 'Things that do not actually matter', b: 'Norms about meeting culture, communication style, and relationship building that are real but unstated', c: 'Rules that only apply to senior staff', d: 'Customs that vary by desk location' }, correct: 'b' }] },
      { id: 2, title: 'Communication in the Workplace', desc: 'Build trust through clear professional communication.', objectives: ['Write clear, concise professional emails', 'Run and participate in effective meetings', 'Navigate difficult conversations professionally'], summary: 'Communication is the skill that underpins all others at work. Master email writing, meeting participation, and the art of delivering difficult messages—while building trust at every level of the organisation.', quiz: [{ question: 'A professional email should always:', options: { a: 'Be as long as possible to show thoroughness', b: 'Have a clear subject, be concise, include a specific action or request, and be proofread', c: 'Include all background information regardless of relevance', d: 'Start with lengthy pleasantries' }, correct: 'b' }, { question: 'When participating in a meeting, you should:', options: { a: 'Only speak when directly asked a question', b: 'Come prepared, contribute relevant points, and follow up on your action items', c: 'Multitask on your laptop throughout', d: 'Dominate the conversation to show engagement' }, correct: 'b' }, { question: 'When you disagree with a colleague, you should:', options: { a: 'Say nothing to avoid conflict', b: 'Express your perspective respectfully, focusing on the issue and not the person', c: 'Disagree publicly in team meetings to make your point', d: 'Complain to others without addressing it directly' }, correct: 'b' }] },
      { id: 3, title: 'Time Management & Productivity', desc: 'Deliver results and manage your workload.', objectives: ['Prioritise work using proven frameworks', 'Manage your calendar effectively', 'Communicate workload issues proactively'], summary: 'Professional productivity is not about working harder—it is about working smarter. Learn to prioritise ruthlessly, manage your time with intention, and deliver consistent results even when workloads are heavy.', quiz: [{ question: 'When your workload is unmanageable, the best approach is:', options: { a: 'Stay silent and work longer hours', b: 'Proactively communicate with your manager about priorities and capacity', c: 'Ignore lower-priority tasks without telling anyone', d: 'Do everything at a lower quality standard' }, correct: 'b' }, { question: 'Effective calendar management means:', options: { a: 'Attending every meeting you are invited to', b: 'Protecting time for focused work, scheduling strategically, and declining non-essential meetings', c: 'Filling every hour of your day with tasks', d: 'Keeping your calendar empty so you are always available' }, correct: 'b' }, { question: 'The Pareto Principle (80/20 rule) suggests:', options: { a: 'You should work 80% of the time', b: '20% of your efforts typically produce 80% of your results—focus there first', c: 'Split time evenly between all tasks', d: '80% of your budget should go to 20% of projects' }, correct: 'b' }] },
      { id: 4, title: 'Building Strong Professional Relationships', desc: 'Develop allies and mentors at work.', objectives: ['Build genuine relationships with colleagues and managers', 'Find and work with mentors effectively', 'Create a professional network that supports your growth'], summary: 'Your career is built on relationships. Learn to genuinely invest in colleagues, find mentors who will accelerate your development, and build a network that creates opportunities you cannot create alone.', quiz: [{ question: 'The best way to build relationships at work is:', options: { a: 'Only interact with people who can directly advance your career', b: 'Show genuine interest, be reliable, and invest in others without immediate expectations', c: 'Socialise at every after-work event', d: 'Stick to formal professional interactions only' }, correct: 'b' }, { question: 'A good mentor relationship involves:', options: { a: 'The mentor doing all the work', b: 'A genuine two-way relationship where the mentee comes prepared and is accountable for their growth', c: 'Only meeting when you have a crisis', d: 'Asking for favours frequently' }, correct: 'b' }, { question: 'Professional networking is most effective when:', options: { a: 'You only network when you need a job', b: 'You consistently invest in relationships long before you need anything from them', c: 'You collect as many contacts as possible', d: 'You connect only with people more senior than you' }, correct: 'b' }] },
      { id: 5, title: 'Problem-Solving & Decision-Making', desc: 'Approach challenges strategically.', objectives: ['Analyse problems systematically', 'Make decisions confidently under uncertainty', 'Communicate solutions effectively to stakeholders'], summary: 'Problem-solving is the skill that gets people promoted. Develop a structured approach to tackling challenges, making good decisions with incomplete information, and presenting solutions that get buy-in.', quiz: [{ question: 'When approaching a complex work problem, the first step is:', options: { a: 'Immediately implement the first solution that comes to mind', b: 'Clearly define the problem before generating and evaluating solutions', c: 'Ask a colleague to solve it for you', d: 'Escalate to your manager immediately' }, correct: 'b' }, { question: 'Good decision-making under uncertainty involves:', options: { a: 'Waiting until you have perfect information', b: 'Gathering relevant information, considering risks, and making a timely, reasoned call', c: 'Always going with your gut feeling', d: 'Letting others decide for you' }, correct: 'b' }, { question: 'When presenting a problem to your manager, you should:', options: { a: 'Only present the problem and ask what to do', b: 'Come with the problem clearly defined and at least one potential solution', c: 'Avoid telling your manager about problems', d: 'Send a long email with all background information' }, correct: 'b' }] },
      { id: 6, title: 'Feedback, Criticism & Growth', desc: 'Use feedback to accelerate your development.', objectives: ['Receive and process feedback constructively', 'Give feedback effectively to colleagues', 'Build a feedback-seeking mindset'], summary: 'The professionals who grow fastest are those who actively seek and use feedback. Learn to receive criticism without defensiveness, give feedback that lands well, and build the habit of continuous improvement.', quiz: [{ question: 'When receiving critical feedback, the best response is:', options: { a: 'Defend yourself and explain why they are wrong', b: 'Listen without interrupting, ask clarifying questions, and thank them for the input', c: 'Ignore it if you disagree', d: 'Get upset and show your emotions' }, correct: 'b' }, { question: 'To grow quickly in your career, you should:', options: { a: 'Wait for annual reviews for feedback', b: 'Actively seek regular feedback and immediately apply what you learn', c: 'Avoid feedback to protect your confidence', d: 'Only ask for feedback on projects you are proud of' }, correct: 'b' }, { question: 'Good feedback is most effective when it is:', options: { a: 'General and covers everything at once', b: 'Specific, timely, focused on behaviour, and delivered with care', c: 'Only given in formal review settings', d: 'Delivered anonymously' }, correct: 'b' }] },
      { id: 7, title: 'Meetings, Presentations & Public Speaking', desc: 'Influence and lead with confidence.', objectives: ['Structure and deliver compelling presentations', 'Manage meeting nerves effectively', 'Communicate confidently with senior audiences'], summary: 'Visibility is currency in your career. Learn to structure compelling presentations, manage nerves, and command a room—whether presenting to your team, senior leadership, or external stakeholders.', quiz: [{ question: 'The most important element of a good presentation is:', options: { a: 'Using the most visually complex slides', b: 'A clear structure with one main message and supporting evidence the audience can act on', c: 'Speaking as quickly as possible', d: 'Including every piece of data you have' }, correct: 'b' }, { question: 'Nerves before presenting are best managed by:', options: { a: 'Avoiding public speaking entirely', b: 'Thorough preparation, deep breathing, and reframing nerves as energy', c: 'Imagining the audience naked', d: 'Speaking faster to get it over with' }, correct: 'b' }, { question: 'When presenting to senior leadership, you should:', options: { a: 'Include all the detail to show you know your subject', b: 'Lead with your conclusion, back it with key evidence, and be prepared for tough questions', c: 'Avoid making recommendations—let them decide', d: 'Be as brief as possible regardless of content' }, correct: 'b' }] },
      { id: 8, title: 'Conflict Resolution at Work', desc: 'Handle disagreements professionally.', objectives: ['Address workplace conflict proactively', 'Separate positions from underlying interests', 'Know when to involve HR or management'], summary: 'Conflict is inevitable—but poor conflict management is not. Learn to address workplace disagreements directly, find common ground, and know when to escalate for professional support.', quiz: [{ question: 'The best way to handle workplace conflict is:', options: { a: 'Avoid the person and hope it resolves itself', b: 'Address it privately, directly, and as soon as possible with the person involved', c: 'Complain to mutual colleagues to build a coalition', d: 'Send a long accusatory email' }, correct: 'b' }, { question: 'Interest-based conflict resolution means:', options: { a: 'Focusing on who is right', b: 'Looking beyond stated positions to understand what each person actually needs and finding common ground', c: 'Negotiating until someone wins', d: 'Bringing in outside arbitration immediately' }, correct: 'b' }, { question: 'You should escalate a conflict to HR or management when:', options: { a: 'You feel slightly annoyed with a colleague', b: 'Direct resolution has failed, the issue involves harassment or serious misconduct, or safety is at risk', c: 'You want someone else to handle it for you', d: 'You do not like the other person' }, correct: 'b' }] },
      { id: 9, title: 'Performance Reviews & Career Conversations', desc: 'Advocate for yourself and set goals.', objectives: ['Prepare effectively for performance reviews', 'Advocate for yourself with evidence', 'Have direct career conversations with your manager'], summary: 'Your performance review is not something that happens to you—it is something you prepare for and lead. Learn to document your achievements, have direct career conversations, and advocate for the recognition and growth you deserve.', quiz: [{ question: 'The best way to prepare for a performance review is:', options: { a: 'Let your manager do all the preparation', b: 'Document your achievements throughout the year and arrive with specific examples and goals', c: 'Ask colleagues for a list of your accomplishments', d: 'Focus only on explaining past challenges' }, correct: 'b' }, { question: 'If you feel you deserve a promotion or pay rise, you should:', options: { a: 'Wait until your manager offers it voluntarily', b: 'Have a direct, evidence-based conversation stating your case clearly', c: 'Complain to other colleagues', d: 'Threaten to leave if not promoted' }, correct: 'b' }, { question: 'Career conversations with your manager should happen:', options: { a: 'Only at annual reviews', b: 'Regularly throughout the year, not just at formal review times', c: 'Only when you want a promotion', d: 'Only when there is a problem' }, correct: 'b' }] },
      { id: 10, title: 'Leadership Mindset & Career Advancement', desc: 'Position yourself for growth and promotion.', objectives: ['Develop a leadership mindset from any level', 'Position yourself for promotion proactively', 'Build executive presence over time'], summary: 'Leadership is not a job title—it is a way of showing up. Learn to develop a leadership mindset from wherever you are, build executive presence, and proactively position yourself for career advancement.', quiz: [{ question: 'A leadership mindset at any level means:', options: { a: 'Only relevant once you are a manager', b: 'Taking ownership, thinking about the bigger picture, and helping others succeed', c: 'Telling others what to do', d: 'Waiting to be given more responsibility' }, correct: 'b' }, { question: 'Executive presence is built through:', options: { a: 'Having an impressive office and job title', b: 'Consistent credibility, clear communication, confidence, and the ability to inspire trust', c: 'Seniority alone', d: 'Wearing expensive clothing' }, correct: 'b' }, { question: 'To get promoted, the most important thing is:', options: { a: 'Working longer hours than everyone else', b: 'Consistently delivering results, being visible, and demonstrating readiness for the next level', c: 'Being the most liked person in the team', d: 'Waiting for opportunities to come to you' }, correct: 'b' }] }
    ]
  }
]
