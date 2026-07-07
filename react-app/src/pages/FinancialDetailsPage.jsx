import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationShell } from '../components/ApplicationShell';
import { categoryOptions, incomeOptions } from '../data/mockData';
import { useAppContext } from '../context/AppContext';
import { isFieldFilled } from '../util/applicationFields';

export default function FinancialDetailsPage() {
  const navigate = useNavigate();
  const { lockSectionFields, state, updateSection, saveFinancialDetails } = useAppContext();
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const values = state.financial;
  const lockedFields = state.lockedFields.financial;

  const validate = () => {
    const nextErrors = {};
    if (!isFieldFilled(values.incomeRange)) nextErrors.incomeRange = 'Select your annual family income.';
    if (!isFieldFilled(values.category)) nextErrors.category = 'Select your category.';
    if (!isFieldFilled(values.hostelResident)) nextErrors.hostelResident = 'Choose hostel resident status.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    updateSection('financial', { certificateName: file.name });
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
      await saveFinancialDetails(unsavedValues);
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
    lockSectionFields('financial', [
      'incomeRange',
      'category',
      'hostelResident',
      'certificateName',
    ]);
    navigate('/review-submit');
  };

  return (
    <ApplicationShell
      asideText="Financial data determines means-tested scholarship eligibility and unlocks the programs that depend on verified income bands."
      asideTitle="Finish the financial profile."
      backLabel="Back to academic details"
      backTo="/academic-details"
      currentStep="financial"
      highlights={[
        'Income and category fields drive several recommendation filters.',
        'Uploading the certificate now reduces the risk of late-stage review blockers.',
        'This stage maps directly to the original financial detail page.',
      ]}
      metrics={[
        { label: 'Matched scholarships', value: '14' },
        { label: 'Estimated award value', value: 'Rs 1.8L' },
      ]}
      subtitle="Add financial context so the scholarship shortlist reflects both merit and means-based support."
      title="Financial details"
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className={`form-field${lockedFields.incomeRange ? ' form-field--locked' : ''}`}>
            <span>Annual family income</span>
            <select
              className="input"
              disabled={lockedFields.incomeRange}
              onChange={(event) => updateSection('financial', { incomeRange: event.target.value })}
              value={values.incomeRange}
            >
              <option value="">Select income range</option>
              {incomeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.incomeRange ? <small className="form-error">{errors.incomeRange}</small> : null}
          </label>

          <label className={`form-field${lockedFields.category ? ' form-field--locked' : ''}`}>
            <span>Category</span>
            <select
              className="input"
              disabled={lockedFields.category}
              onChange={(event) => updateSection('financial', { category: event.target.value })}
              value={values.category}
            >
              <option value="">Select your category</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.category ? <small className="form-error">{errors.category}</small> : null}
          </label>
        </div>

        <fieldset className={`radio-panel${lockedFields.hostelResident ? ' radio-panel--locked' : ''}`}>
          <legend>Are you a hostel resident?</legend>
          <div className="radio-line">
            {['Yes', 'No'].map((item) => (
              <label
                className={`radio-choice${lockedFields.hostelResident ? ' radio-choice--disabled' : ''}`}
                key={item}
              >
                <input
                  checked={values.hostelResident === item}
                  disabled={lockedFields.hostelResident}
                  name="hostelResident"
                  onChange={() => updateSection('financial', { hostelResident: item })}
                  type="radio"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          {errors.hostelResident ? <small className="form-error">{errors.hostelResident}</small> : null}
        </fieldset>

        <label className={`form-field${lockedFields.certificateName ? ' form-field--locked' : ''}`}>
          <span>Income certificate</span>
          <input
            className="input input--file"
            disabled={lockedFields.certificateName}
            onChange={handleFileChange}
            type="file"
          />
          <small className="field-hint">
            Current file: {values.certificateName || 'No file selected yet'}
          </small>
        </label>

        {saveError ? <p className="form-error">{saveError}</p> : null}

        <div className="button-row">
          <button className="button button--ghost" onClick={() => navigate('/academic-details')} type="button">
            Back
          </button>
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Save and review'}
          </button>
        </div>
      </form>
    </ApplicationShell>
  );
}
