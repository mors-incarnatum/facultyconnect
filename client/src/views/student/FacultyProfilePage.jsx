import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Avatar from '../../components/Avatar.jsx';
import PageHead from '../../components/PageHead.jsx';
import { modeLabel } from '../../utils/presentation.js';
import { fmtLong, fmtRange } from '../../utils/format.js';
import { apiUrl } from '../../utils/api.js';

export default function FacultyProfilePage() {
    const { id } = useParams();
    const location = useLocation();
    const { getFaculty, availableSlotsFor, isAvailable } = useApp();
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(function () {
        let cancelled = false;

        async function loadFacultyProfile() {
            setLoadingProfile(true);
            try {

                const response = await fetch(apiUrl(`/faculty/${encodeURIComponent(id)}`), {
                    method: 'GET',
                });
                const data = await response.json();
                if (!cancelled) {
                    setProfileData(data && data.ok ? data : null);
                }
            } catch (err) {
                console.error('Request error:', err);
                if (!cancelled) {
                    setProfileData(null);
                }
            } finally {
                if (!cancelled) {
                    setLoadingProfile(false);
                }
            }
        }

        loadFacultyProfile();
        return function () {
            cancelled = true;
        };
    }, [id]);

    const f = (profileData && profileData.faculty) || getFaculty(id);
    if (loadingProfile && !f) {
        return null;
    }
    if (!f) {
        return (
            <>
                <PageHead title="Faculty member not found" />
                <Link className="btn" to="/student/faculty">← Back to faculty</Link>
            </>
        );
    }

    const slots = profileData && profileData.slots
        ? profileData.slots
            .filter(function (s) {
                return isAvailable(s);
            })
            .sort(function (a, b) {
                return (a.date + a.start).localeCompare(b.date + b.start);
            })
        : availableSlotsFor(f.id);

    const searchReturnTo = location.state && location.state.searchReturnTo;
    const returnTo = location.state && location.state.returnTo;
    const backTarget = searchReturnTo || (returnTo !== location.pathname && returnTo) || '/student/faculty';

    return (
        <>
            <PageHead title={f.name} subtitle={`${f.rank} · ${f.department}`} />
            <p style={{ marginBottom: 16 }}>
                <Link to={backTarget} state={location.state}>
                    ← Back to faculty
                </Link>
            </p>
            <div className="two-col">
                <div className="card profile-card">
                    <div className="profile-header">
                        <Avatar person={f} size="xl" />
                        <div className="profile-header-info">
                            <h2 className="profile-name">
                                {f.name}
                                {f.pronouns && <span className="profile-pronouns">{f.pronouns}</span>}
                            </h2>
                            <div className="profile-rank">{f.rank}</div>
                            <div className="profile-dept">{f.department} · {f.email}</div>
                            <div className="muted small">Office: {f.office}</div>
                        </div>
                    </div>

                    {f.motto && (
                        <blockquote className="profile-quote">
                            “{f.motto}”
                        </blockquote>
                    )}

                    <div>
                        <h3 className="profile-section-title">About</h3>
                        <p style={{ lineHeight: 1.6, margin: 0 }}>{f.bio}</p>
                    </div>

                    {f.specialties && f.specialties.length > 0 && (
                        <div>
                            <h3 className="profile-section-title">Specialties &amp; Research Interests</h3>
                            <div className="profile-tags">
                                {f.specialties.map(function (spec) {
                                    return (
                                        <span key={spec} className="profile-tag highlight">{spec}</span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {f.consultationTip && (
                        <div className="profile-tip">
                            <span className="profile-tip-icon" aria-hidden="true">💡</span>
                            <div>
                                <strong>How to prepare for our consultation:</strong>
                                <div>{f.consultationTip}</div>
                            </div>
                        </div>
                    )}

                    {f.consultationStyle && (
                        <div>
                            <h3 className="profile-section-title">Consultation Style</h3>
                            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{f.consultationStyle}</p>
                        </div>
                    )}

                    {f.officeHoursVibe && (
                        <div>
                            <h3 className="profile-section-title">Office &amp; Meeting Vibe</h3>
                            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{f.officeHoursVibe}</p>
                        </div>
                    )}

                    <hr className="divider" style={{ margin: '4px 0' }} />

                    <dl className="kv">
                        {f.education && (
                            <>
                                <dt>Education</dt>
                                <dd>{f.education}</dd>
                            </>
                        )}
                        <dt>Department</dt>
                        <dd>{f.department}</dd>
                        <dt>Subjects</dt>
                        <dd>{(f.subjects && f.subjects.join(', ')) || '—'}</dd>
                        <dt>Courses</dt>
                        <dd>
                            <div className="profile-tags" style={{ marginTop: 2 }}>
                                {f.courses
                                    ? f.courses.map(function (c) {
                                        return <span key={c} className="profile-tag">{c}</span>;
                                    })
                                    : '—'}
                            </div>
                        </dd>
                        <dt>Office</dt>
                        <dd>{f.office}</dd>
                    </dl>
                </div>

                <div className="card">
                    <h2 style={{ fontSize: 22, marginBottom: 12 }}>Available times</h2>
                    {slots.length === 0 && <p className="muted">No open consultation times right now.</p>}
                    {slots.map(function (s) {
                        return (
                            <div
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 0',
                                    borderTop: '1px solid var(--line)',
                                }}
                            >
                                <div>
                                    <strong>{fmtLong(s.date)}</strong>
                                    <div className="muted small">{fmtRange(s.start, s.end)} · {modeLabel(s)}</div>
                                </div>
                                <Link
                                    className="btn sm"
                                    to={`/student/request?slot=${s.id}`}
                                    state={Object.assign({}, location.state, {
                                        searchReturnTo: searchReturnTo || returnTo,
                                        returnTo: location.pathname,
                                    })}
                                >
                                    Request
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
