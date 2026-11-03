import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Award, BookOpen, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadResults() {
    try {
      setLoading(true);
      const res = await apiRequest('/student/results');
      setResults(res || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load academic marks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <div className="student-results-page">
      <div className="page-header-row mb-4">
        <div>
          <div className="sem-module-badge student-badge">
            <Award size={14} />
            <span>EXAMINATION & SGPA RECORDS</span>
          </div>
          <h2>Academic Results & Marksheets</h2>
          <p>Official semester performance, credits achieved, and verified university marksheets.</p>
        </div>
      </div>

      {loading ? (
        <div className="panel-card p-5 text-center">
          <div className="portal-spinner inline-spinner mb-3" />
          <p>Loading academic semester results…</p>
        </div>
      ) : results.length === 0 ? (
        <div className="panel-card p-5 text-center">
          <BookOpen size={36} style={{ color: 'var(--muted-text)', margin: '0 auto 12px' }} />
          <h4 style={{ color: 'var(--deep-violet-ink)' }}>No Semester Marksheets Uploaded Yet</h4>
          <p style={{ color: 'var(--slate-blue)', fontSize: '16.5px', maxWidth: 460, margin: '0 auto' }}>
            When your end-semester examination results and verified marksheets are recorded by your department, they will be cataloged here.
          </p>
        </div>
      ) : (
        <div className="panel-card p-4">
          <div className="table-responsive">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>SEMESTER</th>
                  <th>SGPA</th>
                  <th>CREDITS</th>
                  <th>BACKLOGS</th>
                  <th>EXAM SESSION</th>
                  <th>MARKSHEET DOCUMENT</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="sem-pill-tag">Semester {r.semester}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '18px', color: 'var(--deep-violet-ink)' }}>
                        {r.sgpa ? Number(r.sgpa).toFixed(2) : '—'}
                      </strong>
                    </td>
                    <td>{r.credits_earned || '—'}</td>
                    <td>
                      <span style={{ color: r.backlogs > 0 ? '#dc2626' : '#166534', fontWeight: 700 }}>
                        {r.backlogs || 0}
                      </span>
                    </td>
                    <td>{r.examination_month_year || r.academic_year || 'Regular'}</td>
                    <td>
                      {r.marksheet_url ? (
                        <a
                          href={r.marksheet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-action-view"
                          style={{ textDecoration: 'none' }}
                        >
                          <FileText size={14} />
                          <span>View Marksheet</span>
                        </a>
                      ) : (
                        <span className="text-muted-tiny">Not Attached</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

