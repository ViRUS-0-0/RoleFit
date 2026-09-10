import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeSkills,
  validateProfile,
  evaluateRole,
  evaluateAll,
  getCounts,
  type Role,
  type RawProfileInput,
  type StudentProfile,
} from '../src/core/evaluator.ts';

// Static Built-in Profile Baseline from Spec
const builtInProfile: RawProfileInput = {
  branch: 'CSE',
  cgpa: '8.1',
  graduationYear: '2027',
  activeBacklogs: '1',
  skills: 'Git, Python, SQL',
};

// ============================================================================
// 1. normalizeSkills Suite
// ============================================================================
describe('1. normalizeSkills', () => {
  test('trims leading and trailing whitespace from each skill token', () => {
    const input = '   python   ,   git   ,   sql   ';
    const result = normalizeSkills(input);
    assert.deepEqual(result, ['python', 'git', 'sql']);
  });

  test('splits correctly on commas with variable spacing', () => {
    const input = 'Python,Git,SQL';
    const result = normalizeSkills(input);
    assert.deepEqual(result, ['python', 'git', 'sql']);
  });

  test('drops empty pieces such as leading, trailing, and duplicate consecutive commas', () => {
    const input = ',,Python,,  ,Git,SQL,,,';
    const result = normalizeSkills(input);
    assert.deepEqual(result, ['python', 'git', 'sql']);
  });

  test('collapses duplicate skills case-insensitively', () => {
    const input = 'Python, python, PYTHON, Git, git, SQL, sql';
    const result = normalizeSkills(input);
    assert.deepEqual(result, ['python', 'git', 'sql']);
  });

  test('returns an empty array when given an empty or whitespace-only string', () => {
    assert.deepEqual(normalizeSkills(''), []);
    assert.deepEqual(normalizeSkills('     '), []);
  });
});

// ============================================================================
// 2. validateProfile Suite
// ============================================================================
describe('2. validateProfile', () => {
  test('valid built-in profile returns null (no validation error)', () => {
    const error = validateProfile(builtInProfile);
    assert.equal(error, null);
  });

  test('blank or whitespace-only branch yields INVALID_BRANCH', () => {
    assert.equal(validateProfile({ ...builtInProfile, branch: '' }), 'INVALID_BRANCH');
    assert.equal(validateProfile({ ...builtInProfile, branch: '   ' }), 'INVALID_BRANCH');
  });

  test('out-of-range or malformed CGPA yields INVALID_CGPA', () => {
    assert.equal(validateProfile({ ...builtInProfile, cgpa: '-0.1' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: '10.1' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: '10.5' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: 'NaN' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: 'Infinity' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: '   ' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: 'abc' }), 'INVALID_CGPA');
    assert.equal(validateProfile({ ...builtInProfile, cgpa: true as any }), 'INVALID_CGPA');
  });

  test('exact CGPA boundary values 0.0 and 10.0 pass validation', () => {
    assert.equal(validateProfile({ ...builtInProfile, cgpa: '0.0' }), null);
    assert.equal(validateProfile({ ...builtInProfile, cgpa: '10.0' }), null);
    assert.equal(validateProfile({ ...builtInProfile, cgpa: 0 }), null);
    assert.equal(validateProfile({ ...builtInProfile, cgpa: 10 }), null);
  });

  test('out-of-range or non-integer graduation year yields INVALID_GRADUATION_YEAR', () => {
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: '1999' }), 'INVALID_GRADUATION_YEAR');
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: '2101' }), 'INVALID_GRADUATION_YEAR');
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: '2027.5' }), 'INVALID_GRADUATION_YEAR');
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: '   ' }), 'INVALID_GRADUATION_YEAR');
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: 'year' }), 'INVALID_GRADUATION_YEAR');
  });

  test('exact graduation year boundaries 2000 and 2100 pass validation', () => {
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: '2000' }), null);
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: '2100' }), null);
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: 2000 }), null);
    assert.equal(validateProfile({ ...builtInProfile, graduationYear: 2100 }), null);
  });

  test('negative or non-integer active backlogs count yields INVALID_BACKLOG_COUNT', () => {
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: '-1' }), 'INVALID_BACKLOG_COUNT');
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: '1.5' }), 'INVALID_BACKLOG_COUNT');
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: '   ' }), 'INVALID_BACKLOG_COUNT');
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: 'none' }), 'INVALID_BACKLOG_COUNT');
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: false as any }), 'INVALID_BACKLOG_COUNT');
  });

  test('exact active backlogs boundary 0 passes validation', () => {
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: '0' }), null);
    assert.equal(validateProfile({ ...builtInProfile, activeBacklogs: 0 }), null);
  });
});

// ============================================================================
// 3. evaluateRole — Rule Independence and Reason Ordering Suite
// ============================================================================
describe('3. evaluateRole — rule independence and reason ordering', () => {
  const roleCF03: Role = {
    id: 'CF03',
    title: 'Embedded Systems Intern',
    allowedBranches: ['ECE', 'EEE'],
    minCgpa: 7.5,
    allowedGraduationYears: [2027],
    maxActiveBacklogs: 1,
    requiredSkills: ['Git'],
  };

  const roleCF04: Role = {
    id: 'CF04',
    title: 'Machine Learning Intern',
    allowedBranches: ['CSE', 'IT'],
    minCgpa: 8.5,
    allowedGraduationYears: [2027],
    maxActiveBacklogs: 1,
    requiredSkills: ['Python'],
  };

  const roleCF05: Role = {
    id: 'CF05',
    title: 'Platform Engineering Intern',
    allowedBranches: ['CSE', 'ECE'],
    minCgpa: 7.0,
    allowedGraduationYears: [2026],
    maxActiveBacklogs: 0,
    requiredSkills: ['Docker', 'Git'],
  };

  test('CF03 with built-in profile reports exactly one failure reason: BRANCH_NOT_ALLOWED', () => {
    const result = evaluateRole(builtInProfile, roleCF03);
    assert.equal(result.status, 'INELIGIBLE');
    assert.deepEqual(result.failureReasons, ['BRANCH_NOT_ALLOWED']);
  });

  test('CF04 with built-in profile reports exactly one failure reason: CGPA_BELOW_MINIMUM', () => {
    const result = evaluateRole(builtInProfile, roleCF04);
    assert.equal(result.status, 'INELIGIBLE');
    assert.deepEqual(result.failureReasons, ['CGPA_BELOW_MINIMUM']);
  });

  test('CF05 with built-in profile reports exactly three failure reasons in required sequence', () => {
    const result = evaluateRole(builtInProfile, roleCF05);
    assert.equal(result.status, 'INELIGIBLE');
    assert.deepEqual(result.failureReasons, [
      'GRADUATION_YEAR_NOT_ALLOWED',
      'TOO_MANY_ACTIVE_BACKLOGS',
      'MISSING_SKILL: Docker',
    ]);
  });

  test('all 5 categories fail simultaneously on synthetic profile and produce all 5 reasons in exact fixed sequence without short-circuiting', () => {
    const syntheticRole: Role = {
      id: 'SYN01',
      title: 'Senior Systems Architect Intern',
      allowedBranches: ['MECH'],
      minCgpa: 9.0,
      allowedGraduationYears: [2025],
      maxActiveBacklogs: 0,
      requiredSkills: ['Rust', 'Zig'],
    };

    // Built-in profile has: branch=CSE, cgpa=8.1, year=2027, backlogs=1, skills=Git, Python, SQL
    // Fails:
    // 1. Branch (CSE not in MECH) -> BRANCH_NOT_ALLOWED
    // 2. CGPA (8.1 < 9.0) -> CGPA_BELOW_MINIMUM
    // 3. Grad year (2027 not in 2025) -> GRADUATION_YEAR_NOT_ALLOWED
    // 4. Backlogs (1 > 0) -> TOO_MANY_ACTIVE_BACKLOGS
    // 5. Missing skills: Rust and Zig (alphabetical) -> MISSING_SKILL: Rust, MISSING_SKILL: Zig
    const result = evaluateRole(builtInProfile, syntheticRole);

    assert.equal(result.status, 'INELIGIBLE');
    assert.deepEqual(result.failureReasons, [
      'BRANCH_NOT_ALLOWED',
      'CGPA_BELOW_MINIMUM',
      'GRADUATION_YEAR_NOT_ALLOWED',
      'TOO_MANY_ACTIVE_BACKLOGS',
      'MISSING_SKILL: Rust',
      'MISSING_SKILL: Zig',
    ]);
  });

  test('multiple missing required skills are each formatted and sorted case-insensitively alphabetically', () => {
    const syntheticRole: Role = {
      id: 'SYN02',
      title: 'Full Stack Wizard Intern',
      allowedBranches: ['CSE'],
      minCgpa: 7.0,
      allowedGraduationYears: [2027],
      maxActiveBacklogs: 1,
      requiredSkills: ['zebra-skill', 'alpha-skill', 'beta-skill'],
    };

    const studentWithNoSkills: RawProfileInput = {
      branch: 'CSE',
      cgpa: '8.0',
      graduationYear: '2027',
      activeBacklogs: '0',
      skills: '',
    };

    const result = evaluateRole(studentWithNoSkills, syntheticRole);
    assert.equal(result.status, 'INELIGIBLE');
    assert.deepEqual(result.failureReasons, [
      'MISSING_SKILL: alpha-skill',
      'MISSING_SKILL: beta-skill',
      'MISSING_SKILL: zebra-skill',
    ]);
  });

  test('fully matching profile returns ELIGIBLE status with zero failure reasons', () => {
    const matchingProfile: RawProfileInput = {
      branch: 'ECE',
      cgpa: '8.0',
      graduationYear: '2027',
      activeBacklogs: '0',
      skills: 'Git, C++',
    };

    const result = evaluateRole(matchingProfile, roleCF03);
    assert.equal(result.status, 'ELIGIBLE');
    assert.deepEqual(result.failureReasons, []);
  });
});

// ============================================================================
// 4. evaluateRole — Boundary Inclusivity Suite
// ============================================================================
describe('4. evaluateRole — boundary inclusivity', () => {
  const boundaryRole: Role = {
    id: 'CF02',
    title: 'QA Automation Intern',
    allowedBranches: ['CSE', 'ECE', 'IT'],
    minCgpa: 7.0,
    allowedGraduationYears: [2027, 2028],
    maxActiveBacklogs: 1,
    requiredSkills: ['Git'],
  };

  test('CGPA exactly equal to role minimum passes the CGPA check without failure reason', () => {
    const profileExactCgpa: RawProfileInput = {
      branch: 'CSE',
      cgpa: '7.0', // Exactly equals minCgpa 7.0
      graduationYear: '2027',
      activeBacklogs: '0',
      skills: 'Git',
    };

    const result = evaluateRole(profileExactCgpa, boundaryRole);
    assert.equal(result.status, 'ELIGIBLE');
    assert.equal(result.failureReasons.includes('CGPA_BELOW_MINIMUM'), false);
  });

  test('active backlogs count exactly equal to role maximum passes the backlogs check without failure reason', () => {
    const profileExactBacklogs: RawProfileInput = {
      branch: 'CSE',
      cgpa: '8.0',
      graduationYear: '2027',
      activeBacklogs: '1', // Exactly equals maxActiveBacklogs 1
      skills: 'Git',
    };

    const result = evaluateRole(profileExactBacklogs, boundaryRole);
    assert.equal(result.status, 'ELIGIBLE');
    assert.equal(result.failureReasons.includes('TOO_MANY_ACTIVE_BACKLOGS'), false);
  });
});

// ============================================================================
// 5. evaluateRole — Case-Insensitivity and Trimming Suite
// ============================================================================
describe('5. evaluateRole — case-insensitivity and trimming', () => {
  const targetRole: Role = {
    id: 'CF01',
    title: 'Data Operations Intern',
    allowedBranches: ['CSE', 'IT'],
    minCgpa: 7.5,
    allowedGraduationYears: [2027],
    maxActiveBacklogs: 1,
    requiredSkills: ['Python', 'SQL'],
  };

  test('branch entered as " cse " with leading/trailing spaces matches role "CSE"', () => {
    const profile: RawProfileInput = {
      branch: '   cse   ',
      cgpa: '8.0',
      graduationYear: '2027',
      activeBacklogs: '0',
      skills: 'python, sql',
    };

    const result = evaluateRole(profile, targetRole);
    assert.equal(result.status, 'ELIGIBLE');
    assert.equal(result.failureReasons.includes('BRANCH_NOT_ALLOWED'), false);
  });

  test('skill entered as " GIT " with whitespace and uppercase matches required skill "Git"', () => {
    const roleReqGit: Role = {
      id: 'CF02',
      title: 'QA Automation Intern',
      allowedBranches: ['CSE'],
      minCgpa: 7.0,
      allowedGraduationYears: [2027],
      maxActiveBacklogs: 1,
      requiredSkills: ['Git'],
    };

    const profile: RawProfileInput = {
      branch: 'CSE',
      cgpa: '8.0',
      graduationYear: '2027',
      activeBacklogs: '0',
      skills: '   GIT   ',
    };

    const result = evaluateRole(profile, roleReqGit);
    assert.equal(result.status, 'ELIGIBLE');
    assert.deepEqual(result.failureReasons, []);
  });
});

// ============================================================================
// 6. evaluateAll — Sorting and Full-Run Correctness Suite
// ============================================================================
describe('6. evaluateAll — sorting and full-run correctness', () => {
  test('built-in profile against all 5 roles returns CF01, CF02, CF03, CF04, CF05 with expected reasons', () => {
    const results = evaluateAll(builtInProfile);

    // Verify ordering
    const ids = results.map((r) => r.roleId);
    assert.deepEqual(ids, ['CF01', 'CF02', 'CF03', 'CF04', 'CF05']);

    // Verify statuses and reasons
    assert.equal(results[0].status, 'ELIGIBLE');
    assert.deepEqual(results[0].failureReasons, []);

    assert.equal(results[1].status, 'ELIGIBLE');
    assert.deepEqual(results[1].failureReasons, []);

    assert.equal(results[2].status, 'INELIGIBLE');
    assert.deepEqual(results[2].failureReasons, ['BRANCH_NOT_ALLOWED']);

    assert.equal(results[3].status, 'INELIGIBLE');
    assert.deepEqual(results[3].failureReasons, ['CGPA_BELOW_MINIMUM']);

    assert.equal(results[4].status, 'INELIGIBLE');
    assert.deepEqual(results[4].failureReasons, [
      'GRADUATION_YEAR_NOT_ALLOWED',
      'TOO_MANY_ACTIVE_BACKLOGS',
      'MISSING_SKILL: Docker',
    ]);
  });

  test('CGPA updated to 8.5 flips CF04 to eligible and sorts eligible group alphabetically by title: CF01, CF04, CF02', () => {
    const profile85: RawProfileInput = {
      ...builtInProfile,
      cgpa: '8.5',
    };

    const results = evaluateAll(profile85);

    // Expected full order:
    // Eligible:
    //   CF01: "Data Operations Intern"
    //   CF04: "Machine Learning Intern"
    //   CF02: "QA Automation Intern"
    // Ineligible:
    //   CF03: "Embedded Systems Intern"
    //   CF05: "Platform Engineering Intern"
    const ids = results.map((r) => r.roleId);
    assert.deepEqual(ids, ['CF01', 'CF04', 'CF02', 'CF03', 'CF05']);

    assert.equal(results[0].roleId, 'CF01');
    assert.equal(results[0].status, 'ELIGIBLE');

    assert.equal(results[1].roleId, 'CF04');
    assert.equal(results[1].status, 'ELIGIBLE');
    assert.deepEqual(results[1].failureReasons, []);

    assert.equal(results[2].roleId, 'CF02');
    assert.equal(results[2].status, 'ELIGIBLE');

    assert.equal(results[3].roleId, 'CF03');
    assert.equal(results[3].status, 'INELIGIBLE');

    assert.equal(results[4].roleId, 'CF05');
    assert.equal(results[4].status, 'INELIGIBLE');
  });

  test('synthetic tiebreak: identical titles in same eligibility group sort by role ID ascending', () => {
    const syntheticRoles: Role[] = [
      {
        id: 'CF09',
        title: 'Alpha Operations Intern',
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
      {
        id: 'CF02',
        title: 'Alpha Operations Intern',
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
    ];

    const results = evaluateAll(builtInProfile, syntheticRoles);
    assert.equal(results[0].roleId, 'CF02');
    assert.equal(results[1].roleId, 'CF09');
  });

  test('case-insensitive title sort: lowercase titles sort according to alphabetical position, not after uppercase', () => {
    const syntheticRoles: Role[] = [
      {
        id: 'R01',
        title: 'beta engineer', // lowercase 'b'
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
      {
        id: 'R02',
        title: 'Alpha Engineer', // uppercase 'A'
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
      {
        id: 'R03',
        title: 'Gamma Engineer', // uppercase 'G'
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
    ];

    const results = evaluateAll(builtInProfile, syntheticRoles);
    // 'Alpha Engineer' -> 'beta engineer' -> 'Gamma Engineer'
    const sortedIds = results.map((r) => r.roleId);
    assert.deepEqual(sortedIds, ['R02', 'R01', 'R03']);
  });
});

// ============================================================================
// 7. getCounts Suite
// ============================================================================
describe('7. getCounts', () => {
  test('built-in profile evaluation results yield exactly 2 eligible and 3 ineligible', () => {
    const results = evaluateAll(builtInProfile);
    const counts = getCounts(results);
    assert.deepEqual(counts, { eligible: 2, ineligible: 3 });
  });

  test('8.5 CGPA profile evaluation results yield exactly 3 eligible and 2 ineligible', () => {
    const profile85: RawProfileInput = { ...builtInProfile, cgpa: '8.5' };
    const results = evaluateAll(profile85);
    const counts = getCounts(results);
    assert.deepEqual(counts, { eligible: 3, ineligible: 2 });
  });

  test('synthetic all-ineligible case yields eligible: 0, ineligible: 5', () => {
    const impossibleProfile: RawProfileInput = {
      branch: 'MECH',
      cgpa: '0.0',
      graduationYear: '2000',
      activeBacklogs: '10',
      skills: 'None',
    };
    const results = evaluateAll(impossibleProfile);
    const counts = getCounts(results);
    assert.deepEqual(counts, { eligible: 0, ineligible: 5 });
  });

  test('synthetic all-eligible case yields eligible: 5, ineligible: 0', () => {
    const universalRoles: Role[] = [
      {
        id: 'U01',
        title: 'Role 1',
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
      {
        id: 'U02',
        title: 'Role 2',
        allowedBranches: ['CSE'],
        minCgpa: 7.0,
        allowedGraduationYears: [2027],
        maxActiveBacklogs: 1,
        requiredSkills: ['Git'],
      },
    ];
    const results = evaluateAll(builtInProfile, universalRoles);
    const counts = getCounts(results);
    assert.deepEqual(counts, { eligible: 2, ineligible: 0 });
  });
});

// ============================================================================
// 8. Integration-style pure-function chain
// ============================================================================
describe('8. Integration-style pure-function chain', () => {
  test('pipeline execution with built-in raw profile matches full acceptance criteria', () => {
    // 1. Raw Profile Input
    const rawInput: RawProfileInput = {
      branch: '  CSE  ',
      cgpa: '8.1',
      graduationYear: '2027',
      activeBacklogs: '1',
      skills: '  Git,  Python  , SQL , Git  ', // Unnormalized with spaces & dupes
    };

    // 2. Validate Profile
    const validationError = validateProfile(rawInput);
    assert.equal(validationError, null);

    // 3. Evaluate All Roles
    const results = evaluateAll(rawInput);

    // 4. Assert Ordered Roles and Statuses
    assert.deepEqual(
      results.map((r) => ({ id: r.roleId, status: r.status })),
      [
        { id: 'CF01', status: 'ELIGIBLE' },
        { id: 'CF02', status: 'ELIGIBLE' },
        { id: 'CF03', status: 'INELIGIBLE' },
        { id: 'CF04', status: 'INELIGIBLE' },
        { id: 'CF05', status: 'INELIGIBLE' },
      ]
    );

    // 5. Assert Aggregate Counts
    const counts = getCounts(results);
    assert.deepEqual(counts, { eligible: 2, ineligible: 3 });
  });

  test('pipeline execution with 8.5-CGPA raw profile reflects CF04 transition and Title A-Z ordering', () => {
    // 1. Raw Profile Input with CGPA 8.5
    const rawInput: RawProfileInput = {
      branch: 'CSE',
      cgpa: '8.5',
      graduationYear: '2027',
      activeBacklogs: '1',
      skills: 'Git, Python, SQL',
    };

    // 2. Validate Profile
    const validationError = validateProfile(rawInput);
    assert.equal(validationError, null);

    // 3. Evaluate All Roles
    const results = evaluateAll(rawInput);

    // 4. Assert Ordered Roles and Statuses
    assert.deepEqual(
      results.map((r) => ({ id: r.roleId, status: r.status })),
      [
        { id: 'CF01', status: 'ELIGIBLE' },
        { id: 'CF04', status: 'ELIGIBLE' },
        { id: 'CF02', status: 'ELIGIBLE' },
        { id: 'CF03', status: 'INELIGIBLE' },
        { id: 'CF05', status: 'INELIGIBLE' },
      ]
    );

    // 5. Assert Aggregate Counts
    const counts = getCounts(results);
    assert.deepEqual(counts, { eligible: 3, ineligible: 2 });
  });
});
