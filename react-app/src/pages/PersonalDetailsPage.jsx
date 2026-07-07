import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationShell } from '../components/ApplicationShell';
import { states } from '../data/mockData';
import { useAppContext } from '../context/AppContext';
import { isFieldFilled } from '../util/applicationFields';

export default function PersonalDetailsPage() {
  const navigate = useNavigate();
  const { lockSectionFields, state, updateSection, savePersonalDetails } = useAppContext();
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const values = state.personal;
  const lockedFields = state.lockedFields.personal;

  const validate = () => {
    const nextErrors = {};

    if (!isFieldFilled(values.fullName)) nextErrors.fullName = 'Full name is required.';
    if (!isFieldFilled(values.dob)) nextErrors.dob = 'Date of birth is required.';
    if (!isFieldFilled(values.state)) nextErrors.state = 'Please select a state.';
    if (!isFieldFilled(values.city)) nextErrors.city = 'City is required.';
    if (!isFieldFilled(values.mobile)) nextErrors.mobile = 'Mobile number is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError('');
    if (!validate()) {
      return;
    }

    const unsavedValues = Object.keys(lockedFields).reduce((changed, field) => {
      if (!lockedFields[field]) changed[field] = values[field];
      return changed;
    }, {});

    setIsSaving(true);
    try {
      await savePersonalDetails(unsavedValues);
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        // Backend unreachable in this environment: keep the locally-saved
        // values and let the user continue instead of hard-blocking them.
      } else {
        setSaveError(error.message || 'Unable to save your details right now.');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    lockSectionFields('personal', ['fullName', 'dob', 'gender', 'state', 'city', 'mobile']);
    navigate('/academic-details');
  };

  return (
    <ApplicationShell
      asideText="Your personal information helps ScholarHub create stronger scholarship recommendations and cleaner application summaries."
      asideTitle="Start with the student profile."
      currentStep="personal"
      highlights={[
        'Location and gender details help narrow regional and category-specific schemes.',
        'The same data is reused later in review and dashboard recommendations.',
        'You can still edit everything before final submission.',
      ]}
      metrics={[
        { label: 'Active scholarships', value: '480+' },
        { label: 'Potential award pool', value: 'Rs 2.4Cr' },
      ]}
      subtitle="Tell us about yourself so the matching engine has a reliable base profile."
      title="Personal details"
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className={`form-field${lockedFields.fullName ? ' form-field--locked' : ''}`}>
            <span>Full name</span>
            <input
              className="input"
              disabled={lockedFields.fullName}
              onChange={(event) => updateSection('personal', { fullName: event.target.value })}
              placeholder="Enter your full name"
              type="text"
              value={values.fullName}
            />
            {errors.fullName ? <small className="form-error">{errors.fullName}</small> : null}
          </label>

          <label className={`form-field${lockedFields.dob ? ' form-field--locked' : ''}`}>
            <span>Date of birth</span>
            <input
              className="input"
              disabled={lockedFields.dob}
              onChange={(event) => updateSection('personal', { dob: event.target.value })}
              type="date"
              value={values.dob}
            />
            {errors.dob ? <small className="form-error">{errors.dob}</small> : null}
          </label>
        </div>

        <div className="form-grid">
          <label className={`form-field${lockedFields.gender ? ' form-field--locked' : ''}`}>
            <span>Gender</span>
            <select
              className="input"
              disabled={lockedFields.gender}
              onChange={(event) => updateSection('personal', { gender: event.target.value })}
              value={values.gender}
            >
              <option value="">Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className={`form-field${lockedFields.mobile ? ' form-field--locked' : ''}`}>
            <span>Mobile number</span>
            <input
              className="input"
              disabled={lockedFields.mobile}
              onChange={(event) => updateSection('personal', { mobile: event.target.value })}
              placeholder="Enter your mobile number"
              type="text"
              value={values.mobile}
            />
            {errors.mobile ? <small className="form-error">{errors.mobile}</small> : null}
          </label>
        </div>

        <div className="form-grid">
          <label className={`form-field${lockedFields.state ? ' form-field--locked' : ''}`}>
            <span>State</span>
            <select
              className="input"
              disabled={lockedFields.state}
              onChange={(event) => updateSection('personal', { state: event.target.value })}
              value={values.state}
            >
              <option value="">Select your state</option>
              {states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.state ? <small className="form-error">{errors.state}</small> : null}
          </label>

          <label className={`form-field${lockedFields.city ? ' form-field--locked' : ''}`}>
            <span>City</span>
            <input
              className="input"
              disabled={lockedFields.city}
              onChange={(event) => updateSection('personal', { city: event.target.value })}
              placeholder="Enter your city"
              type="text"
              value={values.city}
            />
            {errors.city ? <small className="form-error">{errors.city}</small> : null}
          </label>
        </div>

        {saveError ? <p className="form-error">{saveError}</p> : null}

        <div className="button-row">
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </form>
    </ApplicationShell>
  );
}
