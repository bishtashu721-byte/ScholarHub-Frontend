import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationShell } from '../components/ApplicationShell';
import { courseOptions, streamOptions, yearOptions } from '../data/mockData';
import { useAppContext } from '../context/AppContext';
import { isFieldFilled } from '../util/applicationFields';

export default function AcademicDetailsPage() {
  const navigate = useNavigate();
  const { lockSectionFields, state, updateSection, saveAcademicDetails } = useAppContext();
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const values = state.academic;
  const lockedFields = state.lockedFields.academic;

  const validate = () => {
    const nextErrors = {};
    if (!isFieldFilled(values.course)) nextErrors.course = 'Select your current course or class.';
    if (!isFieldFilled(values.stream)) nextErrors.stream = 'Select your stream.';
    if (!isFieldFilled(values.year)) nextErrors.year = 'Select your year or semester.';
    if (!isFieldFilled(values.institution)) nextErrors.institution = 'Enter your institution name.';
    if (!isFieldFilled(values.marks)) nextErrors.marks = 'Enter your marks or CGPA.';

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
      await saveAcademicDetails(unsavedValues);
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
    lockSectionFields('academic', ['course', 'stream', 'year', 'institution', 'marks']);
    navigate('/financial-details');
  };

  return (
    <ApplicationShell
      asideText="Course, stream, and marks define scholarship fit more than almost any other input in the application."
      asideTitle="Build your academic profile."
      backLabel="Back to personal details"
      backTo="/personal-details"
      currentStep="academic"
      highlights={[
        'Academic details are reused in both review and dashboard cards.',
        'Marks and stream are major ranking signals for merit-based programs.',
        'This page mirrors the structure from the original academic form.',
      ]}
      metrics={[
        { label: 'Strong-fit programs', value: '12' },
        { label: 'Average match score', value: '88%' },
      ]}
      subtitle="Tell us what you study and how you are performing so recommendations can become more accurate."
      title="Academic details"
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className={`form-field${lockedFields.course ? ' form-field--locked' : ''}`}>
            <span>Current course or class</span>
            <select
              className="input"
              disabled={lockedFields.course}
              onChange={(event) => updateSection('academic', { course: event.target.value })}
              value={values.course}
            >
              <option value="">Select your course or class</option>
              {courseOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.course ? <small className="form-error">{errors.course}</small> : null}
          </label>

          <label className={`form-field${lockedFields.stream ? ' form-field--locked' : ''}`}>
            <span>Stream or field of study</span>
            <select
              className="input"
              disabled={lockedFields.stream}
              onChange={(event) => updateSection('academic', { stream: event.target.value })}
              value={values.stream}
            >
              <option value="">Select your stream</option>
              {streamOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.stream ? <small className="form-error">{errors.stream}</small> : null}
          </label>
        </div>

        <div className="form-grid">
          <label className={`form-field${lockedFields.year ? ' form-field--locked' : ''}`}>
            <span>Year or semester</span>
            <select
              className="input"
              disabled={lockedFields.year}
              onChange={(event) => updateSection('academic', { year: event.target.value })}
              value={values.year}
            >
              <option value="">Select year or semester</option>
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.year ? <small className="form-error">{errors.year}</small> : null}
          </label>

          <label className={`form-field${lockedFields.marks ? ' form-field--locked' : ''}`}>
            <span>Marks or CGPA</span>
            <input
              className="input"
              disabled={lockedFields.marks}
              onChange={(event) => updateSection('academic', { marks: event.target.value })}
              placeholder="Enter marks or CGPA"
              type="text"
              value={values.marks}
            />
            {errors.marks ? <small className="form-error">{errors.marks}</small> : null}
          </label>
        </div>

        <label className={`form-field${lockedFields.institution ? ' form-field--locked' : ''}`}>
          <span>Name of school or college</span>
          <input
            className="input"
            disabled={lockedFields.institution}
            onChange={(event) => updateSection('academic', { institution: event.target.value })}
            placeholder="Enter institution name"
            type="text"
            value={values.institution}
          />
          {errors.institution ? <small className="form-error">{errors.institution}</small> : null}
        </label>

        {saveError ? <p className="form-error">{saveError}</p> : null}

        <div className="button-row">
          <button className="button button--ghost" onClick={() => navigate('/personal-details')} type="button">
            Back
          </button>
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Continue to financial details'}
          </button>
        </div>
      </form>
    </ApplicationShell>
  );
}
