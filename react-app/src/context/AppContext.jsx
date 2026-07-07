import { createContext, useContext, useEffect, useState } from 'react';
import {
  activityFeed,
  applicationItems,
  assistantQuickReplies,
  deadlineItems,
  initialAssistantMessages,
  initialNotifications,
  programs,
  recommendedPrograms,
} from '../data/mockData';
import { URL } from '../util/api';
import { get, put } from '../util/request';

const STORAGE_KEY = 'scholarhub-react-state-v1';
const USERS_UPDATED_KEY = 'scholarhub-users-updated-at';
const lockedFieldSections = {
  personal: ['fullName', 'dob', 'gender', 'state', 'city', 'mobile'],
  academic: ['course', 'stream', 'year', 'institution', 'marks'],
  financial: ['incomeRange', 'category', 'hostelResident', 'certificateName'],
};

// Maps local form field names to the /user/profile backend field names.
// Only fields with a confirmed backend equivalent (seen in applyUserProfile's
// GET response mapping) are listed — fields without one (academic: stream,
// year; financial: incomeRange, hostelResident, certificateName) are
// intentionally left out rather than guessed, and stay local-only for now.
const PERSONAL_FIELD_TO_PAYLOAD_KEY = {
  fullName: 'name',
  dob: 'dateOfBirth',
  gender: 'gender',
  state: 'state',
  city: 'city',
  mobile: 'mobile',
};

const ACADEMIC_FIELD_TO_PAYLOAD_KEY = {
  course: 'educationLevel',
  institution: 'collegeName',
  marks: 'cgpa',
};

const FINANCIAL_FIELD_TO_PAYLOAD_KEY = {
  category: 'category',
};

function isFieldSaved(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

function createSectionLocks(fieldNames) {
  return fieldNames.reduce((locks, fieldName) => {
    locks[fieldName] = false;
    return locks;
  }, {});
}

function createDefaultLockedFields() {
  return {
    personal: createSectionLocks(lockedFieldSections.personal),
    academic: createSectionLocks(lockedFieldSections.academic),
    financial: createSectionLocks(lockedFieldSections.financial),
  };
}

function createLockedFieldsFromValues(stateLike) {
  const defaultLockedFields = createDefaultLockedFields();

  return {
    personal: lockedFieldSections.personal.reduce(
      (locks, fieldName) => ({
        ...locks,
        [fieldName]: isFieldSaved(stateLike.personal?.[fieldName]),
      }),
      defaultLockedFields.personal
    ),
    academic: lockedFieldSections.academic.reduce(
      (locks, fieldName) => ({
        ...locks,
        [fieldName]: isFieldSaved(stateLike.academic?.[fieldName]),
      }),
      defaultLockedFields.academic
    ),
    financial: lockedFieldSections.financial.reduce(
      (locks, fieldName) => ({
        ...locks,
        [fieldName]: isFieldSaved(stateLike.financial?.[fieldName]),
      }),
      defaultLockedFields.financial
    ),
  };
}

const legacyDemoState = {
  profile: {
    name: 'Arjun Kumar',
    email: 'arjun.kumar@example.com',
    phone: '+91 98765 43210',
    course: 'B.Tech Computer Science',
    year: '2nd Year',
    educationLevel: 'Undergraduate',
    studentType: 'College',
  },
  personal: {
    fullName: 'Arjun Kumar',
    dob: '2004-08-15',
    gender: 'Male',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    mobile: '+91 98765 43210',
  },
  academic: {
    studentType: 'College',
    course: 'Undergraduate - Year 2',
    stream: 'Computer Science / IT',
    year: 'Semester 3',
    institution: 'Institute of Engineering and Technology, Lucknow',
    marks: '8.5 / 10',
  },
  financial: {
    incomeRange: 'Rs 2,50,000 - Rs 5,00,000',
    annualIncome: 250000,
    category: 'OBC',
    hostelResident: 'No',
    certificateName: 'income-certificate.pdf',
  },
};

const defaultState = {
  authMode: 'login',
  profile: {
    name: '',
    email: '',
    phone: '',
    course: '',
    year: '',
    educationLevel: '',
    studentType: '',
    role: '',
  },
  personal: {
    fullName: '',
    dob: '',
    gender: '',
    state: '',
    city: '',
    mobile: '',
  },
  academic: {
    studentType: '',
    course: '',
    stream: '',
    year: '',
    institution: '',
    marks: '',
  },
  financial: {
    incomeRange: '',
    annualIncome: '',
    category: '',
    hostelResident: '',
    certificateName: '',
  },
  lockedFields: createDefaultLockedFields(),
  registration: {
    status: 'idle',
    registeredAt: null,
    lastResponse: null,
  },
  declarationAccepted: true,
  applicationStatus: 'draft',
  submittedAt: null,
  selectedProgramId: 'sbi-scholarship',
  notifications: initialNotifications,
  assistantMessages: initialAssistantMessages,
};

const AppContext = createContext(null);

function isLegacyDemoState(state) {
  return (
    state.profile.name === legacyDemoState.profile.name &&
    state.profile.email === legacyDemoState.profile.email &&
    state.personal.fullName === legacyDemoState.personal.fullName &&
    state.personal.mobile === legacyDemoState.personal.mobile &&
    state.academic.institution === legacyDemoState.academic.institution &&
    state.financial.certificateName === legacyDemoState.financial.certificateName
  );
}

function loadState() {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw);
    const mergedState = {
      ...defaultState,
      ...parsed,
      profile: { ...defaultState.profile, ...parsed.profile },
      personal: { ...defaultState.personal, ...parsed.personal },
      academic: { ...defaultState.academic, ...parsed.academic },
      financial: { ...defaultState.financial, ...parsed.financial },
      registration: { ...defaultState.registration, ...parsed.registration },
    };
    const computedLockedFields = createLockedFieldsFromValues(mergedState);
    const mergedLockedFields = {
      personal: parsed.lockedFields?.personal
        ? { ...computedLockedFields.personal, ...parsed.lockedFields.personal }
        : computedLockedFields.personal,
      academic: parsed.lockedFields?.academic
        ? { ...computedLockedFields.academic, ...parsed.lockedFields.academic }
        : computedLockedFields.academic,
      financial: parsed.lockedFields?.financial
        ? { ...computedLockedFields.financial, ...parsed.lockedFields.financial }
        : computedLockedFields.financial,
    };
    const normalizedState = {
      ...mergedState,
      lockedFields: mergedLockedFields,
    };

    if (isLegacyDemoState(normalizedState)) {
      return defaultState;
    }

    return normalizedState;
  } catch {
    return defaultState;
  }
}

function getIncomeRangeLabel(income) {
  if (income < 100000) {
    return 'Below Rs 1,00,000';
  }

  if (income < 250000) {
    return 'Rs 1,00,000 - Rs 2,50,000';
  }

  if (income < 500000) {
    return 'Rs 2,50,000 - Rs 5,00,000';
  }

  if (income < 800000) {
    return 'Rs 5,00,000 - Rs 8,00,000';
  }

  return 'Above Rs 8,00,000';
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('scholarhub-auth-token') || window.localStorage.getItem('token') || '';
}

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function getCleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// The backend's /user/profile route currently only returns JWT claims
// (id, email, role, iat) rather than the stored user document, so `name`
// is usually empty. Rather than show a blank "Welcome back," this derives
// a readable display name from the email's local part as a fallback —
// display-only, never written into the editable personal-details form.
function deriveDisplayNameFromEmail(email) {
  const localPart = email.split('@')[0] || '';
  return localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRoleLabel(role) {
  const cleanRole = getCleanString(role).toLowerCase().replace(/s$/, '');
  return cleanRole ? cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1) : '';
}

function getAssistantReply(text, state) {
  const normalized = text.toLowerCase();
  const selectedProgram =
    programs.find((program) => program.id === state.selectedProgramId) ?? programs[0];

  if (normalized.includes('document')) {
    return `You should keep these ready for ${selectedProgram.title}: ${selectedProgram.documents.join(', ')}. The income certificate is the most common blocker right now.`;
  }

  if (normalized.includes('deadline') || normalized.includes('last date')) {
    return `${selectedProgram.title} is currently tracked with a deadline of ${selectedProgram.deadline}. I would finish the review step at least 48 hours before that date.`;
  }

  if (normalized.includes('eligible') || normalized.includes('eligibility')) {
    return `For ${selectedProgram.title}, the main checks are: ${selectedProgram.eligibility.join('; ')}. Based on your current profile, you are still within the strongest fit range.`;
  }

  if (normalized.includes('nsp')) {
    return 'For NSP, complete your identity, academic, and bank details first. Then verify scheme-specific income and category rules before final submission.';
  }

  if (normalized.includes('income') || normalized.includes('category')) {
    return `Your current financial profile is set to ${state.financial.incomeRange} and category ${state.financial.category}. That keeps several merit-cum-means style scholarships open.`;
  }

  return `I can help with eligibility, documents, deadlines, or next actions. Right now I would focus on ${selectedProgram.title} because it has the highest fit score in your dashboard.`;
}

function calculateCompletion(currentState) {
  const checkpoints = [
    currentState.personal.fullName,
    currentState.personal.dob,
    currentState.personal.gender,
    currentState.personal.state,
    currentState.personal.city,
    currentState.academic.course,
    currentState.academic.stream,
    currentState.academic.year,
    currentState.academic.institution,
    currentState.academic.marks,
    currentState.financial.incomeRange,
    currentState.financial.category,
    currentState.financial.hostelResident,
  ];

  const filled = checkpoints.filter(Boolean).length;
  return Math.round((filled / checkpoints.length) * 100);
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    const hasProfileSnapshot =
      Boolean(state.profile.email) ||
      Boolean(state.personal.fullName) ||
      Boolean(state.personal.mobile) ||
      Boolean(state.academic.institution);

    if (hasProfileSnapshot) {
      return;
    }

    let isCancelled = false;

    const hydrateFromToken = async () => {
      try {
        const profile = await get(URL.Profile, {
          headers: { Authorization: token },
        });

        if (isCancelled) {
          return;
        }

        applyUserProfile(profile);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (error.status === 401 || error.status === 403) {
          window.localStorage.removeItem('scholarhub-auth-token');
          window.localStorage.removeItem('token');
        }
      }
    };

    hydrateFromToken();

    return () => {
      isCancelled = true;
    };
  }, [state.profile.email, state.personal.fullName, state.personal.mobile, state.academic.institution]);

  const setAuthMode = (mode) => {
    setState((current) => ({
      ...current,
      authMode: mode,
    }));
  };

  const applyUserProfile = (userProfile) => {
    const annualIncome = Number(userProfile?.income);
    const cgpa = Number(userProfile?.cgpa);
    const fullName = getCleanString(userProfile?.name);
    const email = getCleanString(userProfile?.email).toLowerCase();
    const mobile = getCleanString(userProfile?.mobile);
    const educationLevel = getCleanString(userProfile?.educationLevel);
    const studentType = getCleanString(userProfile?.studentType);
    const city = getCleanString(userProfile?.city);
    const collegeName = getCleanString(userProfile?.collegeName);
    const stateName = getCleanString(userProfile?.state);
    const category = getCleanString(userProfile?.category);
    const gender = getCleanString(userProfile?.gender);
    const role = formatRoleLabel(userProfile?.role);
    const displayName = fullName || deriveDisplayNameFromEmail(email);

    setState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        name: displayName,
        email,
        phone: mobile,
        educationLevel,
        studentType,
        role,
      },
      personal: {
        ...current.personal,
        fullName,
        dob: formatDateForInput(userProfile?.dateOfBirth),
        gender,
        state: stateName,
        city,
        mobile,
      },
      academic: {
        ...current.academic,
        studentType,
        course: educationLevel || current.academic.course,
        institution: collegeName,
        marks: Number.isFinite(cgpa) ? String(cgpa) : current.academic.marks,
      },
      financial: {
        ...current.financial,
        annualIncome: Number.isFinite(annualIncome) ? annualIncome : current.financial.annualIncome,
        incomeRange: Number.isFinite(annualIncome)
          ? getIncomeRangeLabel(annualIncome)
          : current.financial.incomeRange,
        category,
      },
      lockedFields: createLockedFieldsFromValues({
        ...current,
        personal: {
          ...current.personal,
          fullName,
          dob: formatDateForInput(userProfile?.dateOfBirth),
          gender,
          state: stateName,
          city,
          mobile,
        },
        academic: {
          ...current.academic,
          studentType,
          course: educationLevel || current.academic.course,
          institution: collegeName,
          marks: Number.isFinite(cgpa) ? String(cgpa) : current.academic.marks,
        },
        financial: {
          ...current.financial,
          annualIncome: Number.isFinite(annualIncome) ? annualIncome : current.financial.annualIncome,
          incomeRange: Number.isFinite(annualIncome)
            ? getIncomeRangeLabel(annualIncome)
            : current.financial.incomeRange,
          category,
        },
      }),
      registration: {
        ...current.registration,
        status: 'registered',
        lastResponse: userProfile,
      },
    }));
  };

  const hydrateUserProfile = async (token = getAuthToken()) => {
    if (!token) {
      return null;
    }

    const profile = await get(URL.Profile, {
      headers: { Authorization: token },
    });

    applyUserProfile(profile);
    return profile;
  };

  const saveProfileFields = async (changedValues, fieldToPayloadKey) => {
    const payload = Object.entries(changedValues).reduce((acc, [field, value]) => {
      const payloadKey = fieldToPayloadKey[field];
      if (!payloadKey || value === undefined) return acc;
      acc[payloadKey] = typeof value === 'string' ? value.trim() : value;
      return acc;
    }, {});

    if (Object.keys(payload).length === 0) {
      return null;
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('You need to be logged in to save your details.');
    }

    return put(URL.Profile, payload, { headers: { Authorization: token } });
  };

  const savePersonalDetails = (changedPersonalDetails) =>
    saveProfileFields(changedPersonalDetails, PERSONAL_FIELD_TO_PAYLOAD_KEY);

  const saveAcademicDetails = (changedAcademicDetails) => {
    const normalized = { ...changedAcademicDetails };
    if (normalized.marks !== undefined) {
      const numericMarks = Number(normalized.marks);
      normalized.marks = Number.isFinite(numericMarks) ? numericMarks : normalized.marks;
    }
    return saveProfileFields(normalized, ACADEMIC_FIELD_TO_PAYLOAD_KEY);
  };

  const saveFinancialDetails = (changedFinancialDetails) =>
    saveProfileFields(changedFinancialDetails, FINANCIAL_FIELD_TO_PAYLOAD_KEY);

  const applyRegistrationProfile = (registrationForm, response) => {
    const annualIncome = Number(registrationForm.income);
    const cgpa = Number(registrationForm.cgpa);
    const registeredAt = new Date().toISOString();

    setState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        name: registrationForm.name.trim(),
        email: registrationForm.email.trim().toLowerCase(),
        phone: registrationForm.mobile.trim(),
        educationLevel: registrationForm.educationLevel,
        studentType: registrationForm.studentType,
      },
      personal: {
        ...current.personal,
        fullName: registrationForm.name.trim(),
        dob: registrationForm.dateOfBirth,
        gender: registrationForm.gender,
        state: registrationForm.state,
        city: '',
        mobile: registrationForm.mobile.trim(),
      },
      academic: {
        ...current.academic,
        studentType: registrationForm.studentType,
        course: registrationForm.educationLevel,
        stream: '',
        year: '',
        institution: registrationForm.collegeName.trim(),
        marks: Number.isFinite(cgpa) ? String(cgpa) : '',
      },
      financial: {
        ...current.financial,
        category: registrationForm.category,
        annualIncome,
        hostelResident: '',
        certificateName: '',
        incomeRange: Number.isFinite(annualIncome)
          ? getIncomeRangeLabel(annualIncome)
          : '',
      },
      lockedFields: createLockedFieldsFromValues({
        ...current,
        personal: {
          ...current.personal,
          fullName: registrationForm.name.trim(),
          dob: registrationForm.dateOfBirth,
          gender: registrationForm.gender,
          state: registrationForm.state,
          city: '',
          mobile: registrationForm.mobile.trim(),
        },
        academic: {
          ...current.academic,
          studentType: registrationForm.studentType,
          course: registrationForm.educationLevel,
          stream: '',
          year: '',
          institution: registrationForm.collegeName.trim(),
          marks: Number.isFinite(cgpa) ? String(cgpa) : '',
        },
        financial: {
          ...current.financial,
          category: registrationForm.category,
          annualIncome,
          hostelResident: '',
          certificateName: '',
          incomeRange: Number.isFinite(annualIncome)
            ? getIncomeRangeLabel(annualIncome)
            : '',
        },
      }),
      registration: {
        status: 'registered',
        registeredAt,
        lastResponse: response,
      },
    }));

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USERS_UPDATED_KEY, registeredAt);
      window.dispatchEvent(
        new CustomEvent('scholarhub:users-updated', {
          detail: { registeredAt },
        })
      );
    }
  };

  const lockSectionFields = (section, fieldNames) => {
    setState((current) => ({
      ...current,
      lockedFields: {
        ...current.lockedFields,
        [section]: {
          ...current.lockedFields[section],
          ...fieldNames.reduce((locks, fieldName) => {
            if (isFieldSaved(current[section]?.[fieldName])) {
              locks[fieldName] = true;
            }

            return locks;
          }, {}),
        },
      },
    }));
  };

  const updateSection = (section, updates) => {
    setState((current) => {
      const nextState = {
        ...current,
        [section]: {
          ...current[section],
          ...updates,
        },
      };

      if (section === 'personal' && updates.fullName) {
        nextState.profile = {
          ...nextState.profile,
          name: updates.fullName,
        };
      }

      if (section === 'personal' && updates.mobile) {
        nextState.profile = {
          ...nextState.profile,
          phone: updates.mobile,
        };
      }

      if (section === 'academic') {
        nextState.profile = {
          ...nextState.profile,
          course: nextState.academic.stream || nextState.profile.course,
          year: nextState.academic.year || nextState.profile.year,
        };
      }

      return nextState;
    });
  };

  const toggleDeclaration = () => {
    setState((current) => ({
      ...current,
      declarationAccepted: !current.declarationAccepted,
    }));
  };

  const setSelectedProgram = (programId) => {
    setState((current) => ({
      ...current,
      selectedProgramId: programId,
    }));
  };

  const markNotificationRead = (notificationId) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
  };

  const sendAssistantMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setState((current) => {
      const userMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };
      const botMessage = {
        id: `msg-bot-${Date.now() + 1}`,
        role: 'bot',
        content: getAssistantReply(trimmed, current),
      };

      return {
        ...current,
        assistantMessages: [...current.assistantMessages, userMessage, botMessage],
      };
    });
  };

  const resetAssistantConversation = () => {
    setState((current) => ({
      ...current,
      assistantMessages: initialAssistantMessages,
    }));
  };

  const submitApplication = () => {
    setState((current) => ({
      ...current,
      applicationStatus: 'submitted',
      submittedAt: new Date().toISOString(),
      notifications: [
        {
          id: `notif-submit-${Date.now()}`,
          category: 'application',
          title: 'Application submitted successfully',
          description: 'Your review packet was sent to the scholarship team for verification.',
          time: 'Just now',
          read: false,
        },
        ...current.notifications,
      ],
    }));
  };

  const profileCompletion = calculateCompletion(state);
  const unreadNotifications = state.notifications.filter((notification) => !notification.read).length;
  const selectedProgram =
    programs.find((program) => program.id === state.selectedProgramId) ?? programs[0];

  const value = {
    state,
    setAuthMode,
    applyRegistrationProfile,
    applyUserProfile,
    hydrateUserProfile,
    savePersonalDetails,
    saveAcademicDetails,
    saveFinancialDetails,
    lockSectionFields,
    updateSection,
    toggleDeclaration,
    setSelectedProgram,
    markNotificationRead,
    markAllNotificationsRead,
    sendAssistantMessage,
    resetAssistantConversation,
    submitApplication,
    profileCompletion,
    unreadNotifications,
    selectedProgram,
    assistantQuickReplies,
    recommendedPrograms,
    deadlineItems,
    applicationItems,
    activityFeed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
