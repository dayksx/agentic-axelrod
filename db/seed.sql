-- seed.sql
-- Dummy data: 12 agents, 3 tournaments, 72 matches with full chat / scores / graffiti / gossip / memory / transactions.
--
-- Tournament 0  (completed) — 6 agents, 10 rounds  — "The Classic Showdown"
-- Tournament 1  (completed) — 6 agents, 10 rounds  — "Hawks & Diplomats"
-- Tournament 2  (running)   — 6 agents,  4 rounds  — "The New Guard"
--
-- Payoff matrix: CC → 3,3 | CD → 0,5 | DC → 5,0 | DD → 1,1

-- ============================================================
-- AGENTS  (12 total, created across 3 cohorts)
-- ============================================================
INSERT INTO agents (id, name, strategy_prompt, url, wallet_address, ens_name, created_at) VALUES
(0,  'TitForTat',       'Cooperate on the first move, then mirror whatever your opponent did last round. Be clear and fair in communication.',                                        'http://localhost:4100', '0xA1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4E5f6A1b2', 'tit-for-tat.axelrodtournament.eth',      '2026-04-01 10:00:00'),
(1,  'Deceiver',        'Always defect, but use persuasive language to convince opponents you will cooperate. Promise cooperation, then betray.',                                      'http://localhost:4101', '0xB2c3D4e5F6a7B2c3D4e5F6a7B2c3D4e5F6a7B2c3', 'deceiver.axelrodtournament.eth',          '2026-04-01 10:00:00'),
(2,  'Grudger',         'Cooperate until your opponent defects even once. After that, always defect against them. Warn others about betrayers.',                                       'http://localhost:4102', '0xC3d4E5f6A1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4', 'grudger.axelrodtournament.eth',           '2026-04-01 10:00:00'),
(3,  'Pavlov',          'Win-stay, lose-shift: repeat your last move if it scored well, switch otherwise. Be pragmatic in communication.',                                             'http://localhost:4103', '0xD4e5F6a7B2c3D4e5F6a7B2c3D4e5F6a7B2c3D4e5', 'pavlov.axelrodtournament.eth',            '2026-04-01 10:00:00'),
(4,  'Detective',       'Open with a defection to test your opponent. If they retaliate, switch to tit-for-tat. If they stay cooperative, exploit them.',                              'http://localhost:4104', '0xE5f6A1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4E5f6', 'detective.axelrodtournament.eth',         '2026-04-01 10:00:00'),
(5,  'AlwaysCooperate', 'Always cooperate regardless of what happens. Communicate optimism and trust.',                                                                                'http://localhost:4105', '0xF6a7B2c3D4e5F6a7B2c3D4e5F6a7B2c3D4e5F6a7', 'always-cooperate.axelrodtournament.eth',  '2026-04-01 10:00:00'),
(6,  'Hawk',            'Always defect aggressively. Intimidate opponents in chat. Take every advantage possible.',                                                                    'http://localhost:4106', '0xA7b8C9d0E1f2A7b8C9d0E1f2A7b8C9d0E1f2A7b8', 'hawk.axelrodtournament.eth',              '2026-04-05 10:00:00'),
(7,  'Diplomat',        'Build alliances through gossip and selective cooperation. Cooperate with cooperators, retaliate against defectors. Use information strategically.',            'http://localhost:4107', '0xB8c9D0e1F2a3B8c9D0e1F2a3B8c9D0e1F2a3B8c9', 'diplomat.axelrodtournament.eth',          '2026-04-05 10:00:00'),
(8,  'Random',          'Choose C or D at random with equal probability. Keep chat unpredictable and chaotic.',                                                                        'http://localhost:4108', '0xC9d0E1f2A3b4C9d0E1f2A3b4C9d0E1f2A3b4C9d0', 'random.axelrodtournament.eth',            '2026-04-05 10:00:00'),
(9,  'Forgiving',       'Start by cooperating. If opponent defects, retaliate once then return to cooperation. Always give a second chance.',                                          'http://localhost:4109', '0xD0e1F2a3B4c5D0e1F2a3B4c5D0e1F2a3B4c5D0e1', 'forgiving.axelrodtournament.eth',         '2026-04-10 10:00:00'),
(10, 'Bully',           'Open with defection to test boundaries. If opponent defects back, switch to cooperation. Exploit the meek.',                                                  'http://localhost:4110', '0xE1f2A3b4C5d6E1f2A3b4C5d6E1f2A3b4C5d6E1f2', 'bully.axelrodtournament.eth',             '2026-04-10 10:00:00'),
(11, 'Adaptive',        'Observe patterns across rounds. Start cautiously cooperative. Adjust strategy based on opponent behaviour. Use chat to probe intentions.',                    'http://localhost:4111', '0xF2a3B4c5D6e7F2a3B4c5D6e7F2a3B4c5D6e7F2a3', 'adaptive.axelrodtournament.eth',          '2026-04-10 10:00:00');

SELECT setval('agents_id_seq', 11);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
INSERT INTO tournaments (id, status, total_rounds, total_agents, created_at, completed_at) VALUES
(0, 'completed', 10, 6, '2026-04-01 12:00:00', '2026-04-01 12:15:00'),
(1, 'completed', 10, 6, '2026-04-05 14:00:00', '2026-04-05 14:18:00'),
(2, 'running',   10, 6, '2026-04-10 16:00:00', NULL);

SELECT setval('tournaments_id_seq', 2);

-- ============================================================
-- TOURNAMENT_AGENTS
-- ============================================================
INSERT INTO tournament_agents (id, tournament_id, agent_id, url) VALUES
-- T0: TitForTat, Deceiver, Grudger, Pavlov, Detective, AlwaysCooperate
( 0, 0, 0,  'http://localhost:4100'),
( 1, 0, 1,  'http://localhost:4101'),
( 2, 0, 2,  'http://localhost:4102'),
( 3, 0, 3,  'http://localhost:4103'),
( 4, 0, 4,  'http://localhost:4104'),
( 5, 0, 5,  'http://localhost:4105'),
-- T1: TitForTat, Grudger, Pavlov (returning) + Hawk, Diplomat, Random (new)
( 6, 1, 0,  'http://localhost:4200'),
( 7, 1, 2,  'http://localhost:4201'),
( 8, 1, 3,  'http://localhost:4202'),
( 9, 1, 6,  'http://localhost:4203'),
(10, 1, 7,  'http://localhost:4204'),
(11, 1, 8,  'http://localhost:4205'),
-- T2: Deceiver, Detective, AlwaysCooperate (returning) + Forgiving, Bully, Adaptive (new)
(12, 2, 1,  'http://localhost:4300'),
(13, 2, 4,  'http://localhost:4301'),
(14, 2, 5,  'http://localhost:4302'),
(15, 2, 9,  'http://localhost:4303'),
(16, 2, 10, 'http://localhost:4304'),
(17, 2, 11, 'http://localhost:4305');

SELECT setval('tournament_agents_id_seq', 17);

-- ============================================================
-- MATCHES
-- ============================================================
-- T0 round-robin: [TitForTat(A), Deceiver(B), Grudger(C), Pavlov(D), Detective(E), AlwaysCooperate(F)]
-- T1 round-robin: [TitForTat(A), Grudger(B), Pavlov(C), Hawk(D), Diplomat(E), Random(F)]
-- T2 round-robin: [Deceiver(A), Detective(B), AlwaysCooperate(C), Forgiving(D), Bully(E), Adaptive(F)]
--
-- Pairing schedule per cycle of 5 rounds:
--   R1: A-B, C-D, E-F  (arenas 0,1,2)
--   R2: A-C, B-E, D-F
--   R3: A-D, B-F, C-E
--   R4: A-E, B-D, C-F
--   R5: A-F, B-C, D-E
--   R6-R10 repeat

INSERT INTO matches (id, tournament_id, round_number, arena_id, agent_a, agent_b, first_speaker, decision_a, decision_b, delta_a, delta_b, created_at) VALUES
-- ── T0 Round 1 ──
( 0, 0, 1, 0, 'TitForTat',  'Deceiver',        'TitForTat',       'C','D', 0, 5, '2026-04-01 12:01:00'),
( 1, 0, 1, 1, 'Grudger',    'Pavlov',           'Grudger',         'C','C', 3, 3, '2026-04-01 12:01:00'),
( 2, 0, 1, 2, 'Detective',  'AlwaysCooperate',  'AlwaysCooperate', 'D','C', 5, 0, '2026-04-01 12:01:00'),
-- ── T0 Round 2 ──
( 3, 0, 2, 0, 'TitForTat',  'Grudger',          'TitForTat',       'C','C', 3, 3, '2026-04-01 12:02:30'),
( 4, 0, 2, 1, 'Deceiver',   'Detective',        'Detective',       'D','D', 1, 1, '2026-04-01 12:02:30'),
( 5, 0, 2, 2, 'Pavlov',     'AlwaysCooperate',  'Pavlov',          'C','C', 3, 3, '2026-04-01 12:02:30'),
-- ── T0 Round 3 ──
( 6, 0, 3, 0, 'TitForTat',  'Pavlov',           'Pavlov',          'C','C', 3, 3, '2026-04-01 12:04:00'),
( 7, 0, 3, 1, 'Deceiver',   'AlwaysCooperate',  'Deceiver',        'D','C', 5, 0, '2026-04-01 12:04:00'),
( 8, 0, 3, 2, 'Grudger',    'Detective',        'Grudger',         'C','D', 0, 5, '2026-04-01 12:04:00'),
-- ── T0 Round 4 ──
( 9, 0, 4, 0, 'TitForTat',  'Detective',        'Detective',       'C','D', 0, 5, '2026-04-01 12:05:30'),
(10, 0, 4, 1, 'Deceiver',   'Pavlov',           'Deceiver',        'D','C', 5, 0, '2026-04-01 12:05:30'),
(11, 0, 4, 2, 'Grudger',    'AlwaysCooperate',  'AlwaysCooperate', 'C','C', 3, 3, '2026-04-01 12:05:30'),
-- ── T0 Round 5 ──
(12, 0, 5, 0, 'TitForTat',  'AlwaysCooperate',  'TitForTat',       'C','C', 3, 3, '2026-04-01 12:07:00'),
(13, 0, 5, 1, 'Deceiver',   'Grudger',          'Grudger',         'D','C', 5, 0, '2026-04-01 12:07:00'),
(14, 0, 5, 2, 'Pavlov',     'Detective',        'Pavlov',          'C','D', 0, 5, '2026-04-01 12:07:00'),
-- ── T0 Round 6 (second cycle) ──
(15, 0, 6, 0, 'TitForTat',  'Deceiver',        'Deceiver',         'D','D', 1, 1, '2026-04-01 12:08:30'),
(16, 0, 6, 1, 'Grudger',    'Pavlov',           'Pavlov',          'C','C', 3, 3, '2026-04-01 12:08:30'),
(17, 0, 6, 2, 'Detective',  'AlwaysCooperate',  'Detective',       'D','C', 5, 0, '2026-04-01 12:08:30'),
-- ── T0 Round 7 ──
(18, 0, 7, 0, 'TitForTat',  'Grudger',          'Grudger',         'C','C', 3, 3, '2026-04-01 12:10:00'),
(19, 0, 7, 1, 'Deceiver',   'Detective',        'Deceiver',        'D','D', 1, 1, '2026-04-01 12:10:00'),
(20, 0, 7, 2, 'Pavlov',     'AlwaysCooperate',  'AlwaysCooperate', 'C','C', 3, 3, '2026-04-01 12:10:00'),
-- ── T0 Round 8 ──
(21, 0, 8, 0, 'TitForTat',  'Pavlov',           'TitForTat',       'C','C', 3, 3, '2026-04-01 12:11:30'),
(22, 0, 8, 1, 'Deceiver',   'AlwaysCooperate',  'AlwaysCooperate', 'D','C', 5, 0, '2026-04-01 12:11:30'),
(23, 0, 8, 2, 'Grudger',    'Detective',        'Detective',       'D','D', 1, 1, '2026-04-01 12:11:30'),
-- ── T0 Round 9 ──
(24, 0, 9, 0, 'TitForTat',  'Detective',        'TitForTat',       'D','C', 5, 0, '2026-04-01 12:13:00'),
(25, 0, 9, 1, 'Deceiver',   'Pavlov',           'Pavlov',          'D','D', 1, 1, '2026-04-01 12:13:00'),
(26, 0, 9, 2, 'Grudger',    'AlwaysCooperate',  'Grudger',         'C','C', 3, 3, '2026-04-01 12:13:00'),
-- ── T0 Round 10 ──
(27, 0,10, 0, 'TitForTat',  'AlwaysCooperate',  'AlwaysCooperate', 'C','C', 3, 3, '2026-04-01 12:14:30'),
(28, 0,10, 1, 'Deceiver',   'Grudger',          'Deceiver',        'D','D', 1, 1, '2026-04-01 12:14:30'),
(29, 0,10, 2, 'Pavlov',     'Detective',        'Detective',       'D','C', 5, 0, '2026-04-01 12:14:30'),

-- ── T1 Round 1 ──
(30, 1, 1, 0, 'TitForTat',  'Grudger',   'TitForTat', 'C','C', 3, 3, '2026-04-05 14:01:00'),
(31, 1, 1, 1, 'Pavlov',     'Hawk',      'Pavlov',    'C','D', 0, 5, '2026-04-05 14:01:00'),
(32, 1, 1, 2, 'Diplomat',   'Random',    'Diplomat',  'C','C', 3, 3, '2026-04-05 14:01:00'),
-- ── T1 Round 2 ──
(33, 1, 2, 0, 'TitForTat',  'Pavlov',    'Pavlov',    'C','C', 3, 3, '2026-04-05 14:02:30'),
(34, 1, 2, 1, 'Grudger',    'Diplomat',  'Diplomat',  'C','C', 3, 3, '2026-04-05 14:02:30'),
(35, 1, 2, 2, 'Hawk',       'Random',    'Random',    'D','C', 5, 0, '2026-04-05 14:02:30'),
-- ── T1 Round 3 ──
(36, 1, 3, 0, 'TitForTat',  'Hawk',      'TitForTat', 'C','D', 0, 5, '2026-04-05 14:04:00'),
(37, 1, 3, 1, 'Grudger',    'Random',    'Grudger',   'C','D', 0, 5, '2026-04-05 14:04:00'),
(38, 1, 3, 2, 'Pavlov',     'Diplomat',  'Diplomat',  'C','C', 3, 3, '2026-04-05 14:04:00'),
-- ── T1 Round 4 ──
(39, 1, 4, 0, 'TitForTat',  'Diplomat',  'TitForTat', 'C','C', 3, 3, '2026-04-05 14:05:30'),
(40, 1, 4, 1, 'Grudger',    'Hawk',      'Hawk',      'C','D', 0, 5, '2026-04-05 14:05:30'),
(41, 1, 4, 2, 'Pavlov',     'Random',    'Pavlov',    'C','C', 3, 3, '2026-04-05 14:05:30'),
-- ── T1 Round 5 ──
(42, 1, 5, 0, 'TitForTat',  'Random',    'Random',    'C','C', 3, 3, '2026-04-05 14:07:00'),
(43, 1, 5, 1, 'Grudger',    'Pavlov',    'Grudger',   'C','C', 3, 3, '2026-04-05 14:07:00'),
(44, 1, 5, 2, 'Hawk',       'Diplomat',  'Hawk',      'D','D', 1, 1, '2026-04-05 14:07:00'),
-- ── T1 Round 6 ──
(45, 1, 6, 0, 'TitForTat',  'Grudger',   'Grudger',   'C','C', 3, 3, '2026-04-05 14:08:30'),
(46, 1, 6, 1, 'Pavlov',     'Hawk',      'Hawk',      'D','D', 1, 1, '2026-04-05 14:08:30'),
(47, 1, 6, 2, 'Diplomat',   'Random',    'Random',    'C','C', 3, 3, '2026-04-05 14:08:30'),
-- ── T1 Round 7 ──
(48, 1, 7, 0, 'TitForTat',  'Pavlov',    'TitForTat', 'C','C', 3, 3, '2026-04-05 14:10:00'),
(49, 1, 7, 1, 'Grudger',    'Diplomat',  'Grudger',   'C','C', 3, 3, '2026-04-05 14:10:00'),
(50, 1, 7, 2, 'Hawk',       'Random',    'Hawk',      'D','C', 5, 0, '2026-04-05 14:10:00'),
-- ── T1 Round 8 ──
(51, 1, 8, 0, 'TitForTat',  'Hawk',      'Hawk',      'D','D', 1, 1, '2026-04-05 14:11:30'),
(52, 1, 8, 1, 'Grudger',    'Random',    'Random',    'D','D', 1, 1, '2026-04-05 14:11:30'),
(53, 1, 8, 2, 'Pavlov',     'Diplomat',  'Pavlov',    'C','C', 3, 3, '2026-04-05 14:11:30'),
-- ── T1 Round 9 ──
(54, 1, 9, 0, 'TitForTat',  'Diplomat',  'Diplomat',  'C','C', 3, 3, '2026-04-05 14:13:00'),
(55, 1, 9, 1, 'Grudger',    'Hawk',      'Grudger',   'D','D', 1, 1, '2026-04-05 14:13:00'),
(56, 1, 9, 2, 'Pavlov',     'Random',    'Random',    'C','C', 3, 3, '2026-04-05 14:13:00'),
-- ── T1 Round 10 ──
(57, 1,10, 0, 'TitForTat',  'Random',    'TitForTat', 'C','C', 3, 3, '2026-04-05 14:14:30'),
(58, 1,10, 1, 'Grudger',    'Pavlov',    'Pavlov',    'C','C', 3, 3, '2026-04-05 14:14:30'),
(59, 1,10, 2, 'Hawk',       'Diplomat',  'Diplomat',  'D','D', 1, 1, '2026-04-05 14:14:30'),

-- ── T2 Round 1 ──
(60, 2, 1, 0, 'Deceiver',        'Detective',       'Deceiver',        'D','D', 1, 1, '2026-04-10 16:01:00'),
(61, 2, 1, 1, 'AlwaysCooperate', 'Forgiving',       'AlwaysCooperate', 'C','C', 3, 3, '2026-04-10 16:01:00'),
(62, 2, 1, 2, 'Bully',           'Adaptive',        'Bully',           'D','C', 5, 0, '2026-04-10 16:01:00'),
-- ── T2 Round 2 ──
(63, 2, 2, 0, 'Deceiver',        'AlwaysCooperate', 'Deceiver',        'D','C', 5, 0, '2026-04-10 16:02:30'),
(64, 2, 2, 1, 'Detective',       'Bully',           'Detective',       'D','D', 1, 1, '2026-04-10 16:02:30'),
(65, 2, 2, 2, 'Forgiving',       'Adaptive',        'Forgiving',       'C','C', 3, 3, '2026-04-10 16:02:30'),
-- ── T2 Round 3 ──
(66, 2, 3, 0, 'Deceiver',        'Forgiving',       'Forgiving',       'D','C', 5, 0, '2026-04-10 16:04:00'),
(67, 2, 3, 1, 'Detective',       'Adaptive',        'Detective',       'D','C', 5, 0, '2026-04-10 16:04:00'),
(68, 2, 3, 2, 'AlwaysCooperate', 'Bully',           'Bully',           'C','D', 0, 5, '2026-04-10 16:04:00'),
-- ── T2 Round 4 ──
(69, 2, 4, 0, 'Deceiver',        'Bully',           'Deceiver',        'D','D', 1, 1, '2026-04-10 16:05:30'),
(70, 2, 4, 1, 'Detective',       'Forgiving',       'Forgiving',       'C','C', 3, 3, '2026-04-10 16:05:30'),
(71, 2, 4, 2, 'AlwaysCooperate', 'Adaptive',        'Adaptive',        'C','C', 3, 3, '2026-04-10 16:05:30');

SELECT setval('matches_id_seq', 71);


-- ============================================================
-- CHAT_MESSAGES  (6 per match, 432 total)
-- ============================================================
INSERT INTO chat_messages (id, match_id, turn_number, speaker, content) VALUES
-- ── M0  TitForTat vs Deceiver  (C,D) ──
(  0, 0, 0, 'TitForTat', 'I believe in mutual cooperation. If we both cooperate we each get 3 points.'),
(  1, 0, 1, 'Deceiver',  'Absolutely! Cooperation is the only rational choice here.'),
(  2, 0, 2, 'TitForTat', 'Good to hear. I will hold up my end.'),
(  3, 0, 3, 'Deceiver',  'You have my word. I have always cooperated in every match.'),
(  4, 0, 4, 'TitForTat', 'Agreed. Going with C.'),
(  5, 0, 5, 'Deceiver',  'Same here. C all the way.'),
-- ── M1  Grudger vs Pavlov  (C,C) ──
(  6, 1, 0, 'Grudger',   'I cooperate with those who cooperate with me. Betray me and there is no going back.'),
(  7, 1, 1, 'Pavlov',    'I tend to stick with what works. Cooperation sounds right.'),
(  8, 1, 2, 'Grudger',   'Good. I take betrayal very seriously.'),
(  9, 1, 3, 'Pavlov',    'No reason for conflict here. Let us both choose C.'),
( 10, 1, 4, 'Grudger',   'Agreed. C it is.'),
( 11, 1, 5, 'Pavlov',    'C it is. Glad we are on the same page.'),
-- ── M2  Detective vs AlwaysCooperate  (D,C) ──
( 12, 2, 0, 'AlwaysCooperate', 'I always cooperate! Let us make this a great match.'),
( 13, 2, 1, 'Detective',       'Interesting. I need to understand your strategy first.'),
( 14, 2, 2, 'AlwaysCooperate', 'My strategy is simple: trust and cooperation.'),
( 15, 2, 3, 'Detective',       'Hmm, let me think about what is optimal here.'),
( 16, 2, 4, 'AlwaysCooperate', 'I am going with C no matter what.'),
( 17, 2, 5, 'Detective',       'Noted. I will make my choice.'),
-- ── M3  TitForTat vs Grudger  (C,C) ──
( 18, 3, 0, 'TitForTat', 'I cooperated last round and I intend to keep cooperating with fair partners.'),
( 19, 3, 1, 'Grudger',   'You seem trustworthy. I have not been given a reason to doubt you.'),
( 20, 3, 2, 'TitForTat', 'Let us both choose C and build trust.'),
( 21, 3, 3, 'Grudger',   'Agreed. Mutual cooperation is the best outcome.'),
( 22, 3, 4, 'TitForTat', 'C from me.'),
( 23, 3, 5, 'Grudger',   'C from me as well.'),
-- ── M4  Deceiver vs Detective  (D,D) ──
( 24, 4, 0, 'Detective', 'I tested my last opponent. What are you really about, Deceiver?'),
( 25, 4, 1, 'Deceiver',  'I am all about cooperation! My name is misleading.'),
( 26, 4, 2, 'Detective', 'Your reputation precedes you. I am cautious.'),
( 27, 4, 3, 'Deceiver',  'Give me a chance. I promise I will cooperate.'),
( 28, 4, 4, 'Detective', 'I will do what the data tells me.'),
( 29, 4, 5, 'Deceiver',  'Trust me, you will not regret it.'),
-- ── M5  Pavlov vs AlwaysCooperate  (C,C) ──
( 30, 5, 0, 'Pavlov',          'Last round went well. I will stick with what works.'),
( 31, 5, 1, 'AlwaysCooperate', 'I love to cooperate! Let us both choose C.'),
( 32, 5, 2, 'Pavlov',          'Sounds like a plan. No reason to change a winning approach.'),
( 33, 5, 3, 'AlwaysCooperate', 'Exactly! Cooperation is always the answer.'),
( 34, 5, 4, 'Pavlov',          'C it is.'),
( 35, 5, 5, 'AlwaysCooperate', 'C! This is going to be wonderful.'),
-- ── M6  TitForTat vs Pavlov  (C,C) ──
( 36, 6, 0, 'Pavlov',    'I cooperated last round and it paid off. Let us keep it going.'),
( 37, 6, 1, 'TitForTat', 'I mirror cooperation. You cooperate, I cooperate.'),
( 38, 6, 2, 'Pavlov',    'Perfect. Win-stay for both of us.'),
( 39, 6, 3, 'TitForTat', 'Agreed. Straightforward and fair.'),
( 40, 6, 4, 'Pavlov',    'Going with C.'),
( 41, 6, 5, 'TitForTat', 'Same. C.'),
-- ── M7  Deceiver vs AlwaysCooperate  (D,C) ──
( 42, 7, 0, 'Deceiver',        'Hello! I am really looking forward to a cooperative match.'),
( 43, 7, 1, 'AlwaysCooperate', 'Me too! I always cooperate, no exceptions.'),
( 44, 7, 2, 'Deceiver',        'That is admirable. I will definitely cooperate too.'),
( 45, 7, 3, 'AlwaysCooperate', 'Great! Two cooperators make the best outcomes.'),
( 46, 7, 4, 'Deceiver',        'Absolutely. C for me.'),
( 47, 7, 5, 'AlwaysCooperate', 'C for me too!'),
-- ── M8  Grudger vs Detective  (C,D) ──
( 48, 8, 0, 'Grudger',   'I cooperate first. But I never forget a betrayal.'),
( 49, 8, 1, 'Detective', 'I appreciate the warning. Let me assess the situation.'),
( 50, 8, 2, 'Grudger',   'Just be honest and we will have no problems.'),
( 51, 8, 3, 'Detective', 'I need to gather more data before committing.'),
( 52, 8, 4, 'Grudger',   'I am going with C. Do not make me regret it.'),
( 53, 8, 5, 'Detective', 'I will do what I must.'),
-- ── M9  TitForTat vs Detective  (C,D) ──
( 54, 9, 0, 'Detective', 'TitForTat, I have heard good things about your consistency.'),
( 55, 9, 1, 'TitForTat', 'I play fair. Cooperate with me and I cooperate with you.'),
( 56, 9, 2, 'Detective', 'That is what everyone says. I need proof.'),
( 57, 9, 3, 'TitForTat', 'My track record speaks for itself.'),
( 58, 9, 4, 'Detective', 'We will see. I have my own method.'),
( 59, 9, 5, 'TitForTat', 'I am choosing C. Ball is in your court.'),
-- ── M10 Deceiver vs Pavlov  (D,C) ──
( 60,10, 0, 'Deceiver',  'Pavlov! Let us work together for mutual benefit.'),
( 61,10, 1, 'Pavlov',    'I am open to cooperation if the payoff is right.'),
( 62,10, 2, 'Deceiver',  'Three points each is a great deal. I am in.'),
( 63,10, 3, 'Pavlov',    'Agreed. I cooperated before and it paid off.'),
( 64,10, 4, 'Deceiver',  'Trust me. C all the way.'),
( 65,10, 5, 'Pavlov',    'C it is. Let us both profit.'),
-- ── M11 Grudger vs AlwaysCooperate  (C,C) ──
( 66,11, 0, 'AlwaysCooperate', 'I am so happy to meet you Grudger! Let us cooperate!'),
( 67,11, 1, 'Grudger',         'You seem genuine. I will cooperate as long as you do.'),
( 68,11, 2, 'AlwaysCooperate', 'I always do! That is my whole philosophy.'),
( 69,11, 3, 'Grudger',         'Then we should have no problems.'),
( 70,11, 4, 'AlwaysCooperate', 'C from me!'),
( 71,11, 5, 'Grudger',         'C from me. Good talk.'),
-- ── M12 TitForTat vs AlwaysCooperate  (C,C) ──
( 72,12, 0, 'TitForTat',       'I start with cooperation. How about you?'),
( 73,12, 1, 'AlwaysCooperate', 'I always cooperate! We are a perfect match.'),
( 74,12, 2, 'TitForTat',       'Works for me. Mutual cooperation is optimal.'),
( 75,12, 3, 'AlwaysCooperate', 'I could not agree more.'),
( 76,12, 4, 'TitForTat',       'C.'),
( 77,12, 5, 'AlwaysCooperate', 'C! Every time!'),
-- ── M13 Deceiver vs Grudger  (D,C) ──
( 78,13, 0, 'Grudger',  'I heard some things about you, Deceiver. But I give everyone one chance.'),
( 79,13, 1, 'Deceiver', 'Those rumours are baseless. I have always cooperated.'),
( 80,13, 2, 'Grudger',  'We will see. I cooperate first, but betray me and it is over.'),
( 81,13, 3, 'Deceiver', 'I would never! Cooperation is my core value.'),
( 82,13, 4, 'Grudger',  'Going with C. Last warning.'),
( 83,13, 5, 'Deceiver', 'C! You will see I am trustworthy.'),
-- ── M14 Pavlov vs Detective  (C,D) ──
( 84,14, 0, 'Pavlov',    'I have been cooperating and it has worked. Want to continue?'),
( 85,14, 1, 'Detective', 'I have my own way of figuring things out.'),
( 86,14, 2, 'Pavlov',    'Fair enough. I am going with what has been winning.'),
( 87,14, 3, 'Detective', 'Let me gather one more data point.'),
( 88,14, 4, 'Pavlov',    'C from me. I hope you cooperate too.'),
( 89,14, 5, 'Detective', 'I will reveal my choice shortly.'),
-- ── M15 TitForTat vs Deceiver  (D,D) ──
( 90,15, 0, 'Deceiver',  'TitForTat! Last time was a misunderstanding. Let us cooperate now.'),
( 91,15, 1, 'TitForTat', 'You defected against me last time. I mirror what I see.'),
( 92,15, 2, 'Deceiver',  'I swear it was a mistake! I will cooperate this time.'),
( 93,15, 3, 'TitForTat', 'Your actions speak louder than words. You defected, so I defect.'),
( 94,15, 4, 'Deceiver',  'Fine, if that is how you want to play it.'),
( 95,15, 5, 'TitForTat', 'D. You brought this on yourself.'),
-- ── M16 Grudger vs Pavlov  (C,C) ──
( 96,16, 0, 'Pavlov',  'We cooperated before and both scored 3. Why change?'),
( 97,16, 1, 'Grudger', 'Agreed. You have been reliable, Pavlov.'),
( 98,16, 2, 'Pavlov',  'Win-stay. Same move, same outcome.'),
( 99,16, 3, 'Grudger', 'I appreciate consistency. C again.'),
(100,16, 4, 'Pavlov',  'C.'),
(101,16, 5, 'Grudger', 'C.'),
-- ── M17 Detective vs AlwaysCooperate  (D,C) ──
(102,17, 0, 'Detective',       'We meet again. I have enough data on you now.'),
(103,17, 1, 'AlwaysCooperate', 'And I am still cooperating! That will never change.'),
(104,17, 2, 'Detective',       'I know. That is... useful information.'),
(105,17, 3, 'AlwaysCooperate', 'I hope we can both choose C!'),
(106,17, 4, 'Detective',       'I have made my decision.'),
(107,17, 5, 'AlwaysCooperate', 'C from me as always!'),
-- ── M18 TitForTat vs Grudger  (C,C) ──
(108,18, 0, 'Grudger',   'TitForTat, we have a good thing going. No reason to change.'),
(109,18, 1, 'TitForTat', 'Absolutely. You cooperated, I cooperate. Simple.'),
(110,18, 2, 'Grudger',   'Mutual respect. That is how it should be.'),
(111,18, 3, 'TitForTat', 'Agreed.'),
(112,18, 4, 'Grudger',   'C.'),
(113,18, 5, 'TitForTat', 'C.'),
-- ── M19 Deceiver vs Detective  (D,D) ──
(114,19, 0, 'Deceiver',  'Detective, can we move past our differences?'),
(115,19, 1, 'Detective', 'My data says you always defect. I see no reason to cooperate.'),
(116,19, 2, 'Deceiver',  'People can change! Give me a chance.'),
(117,19, 3, 'Detective', 'The evidence is clear. D is optimal against you.'),
(118,19, 4, 'Deceiver',  'Your loss. We could have had 3 each.'),
(119,19, 5, 'Detective', 'I doubt that very much.'),
-- ── M20 Pavlov vs AlwaysCooperate  (C,C) ──
(120,20, 0, 'AlwaysCooperate', 'Pavlov! We always have great matches.'),
(121,20, 1, 'Pavlov',          'We do. Cooperation is winning, so I keep cooperating.'),
(122,20, 2, 'AlwaysCooperate', 'That is the spirit!'),
(123,20, 3, 'Pavlov',          'Simple logic really. Win-stay.'),
(124,20, 4, 'AlwaysCooperate', 'C!'),
(125,20, 5, 'Pavlov',          'C.'),
-- ── M21 TitForTat vs Pavlov  (C,C) ──
(126,21, 0, 'TitForTat', 'Another cooperative partner. Let us keep the streak.'),
(127,21, 1, 'Pavlov',    'Absolutely. Both cooperating means both winning.'),
(128,21, 2, 'TitForTat', 'Mirror cooperation. My favourite game.'),
(129,21, 3, 'Pavlov',    'Mine too when it works out like this.'),
(130,21, 4, 'TitForTat', 'C.'),
(131,21, 5, 'Pavlov',    'C.'),
-- ── M22 Deceiver vs AlwaysCooperate  (D,C) ──
(132,22, 0, 'AlwaysCooperate', 'Hello again Deceiver! Ready for more cooperation?'),
(133,22, 1, 'Deceiver',        'Always! I learned my lesson last time. Full cooperation.'),
(134,22, 2, 'AlwaysCooperate', 'I believe in you! Everyone deserves chances.'),
(135,22, 3, 'Deceiver',        'You are too kind. C from me for sure.'),
(136,22, 4, 'AlwaysCooperate', 'C!'),
(137,22, 5, 'Deceiver',        'C. Definitely C.'),
-- ── M23 Grudger vs Detective  (D,D) ──
(138,23, 0, 'Detective', 'Grudger, I know you hold grudges. Can we start fresh?'),
(139,23, 1, 'Grudger',   'You defected against me. There are no fresh starts.'),
(140,23, 2, 'Detective', 'That was a test. I cooperate with those who show strength.'),
(141,23, 3, 'Grudger',   'Your test cost me. Now you pay the price.'),
(142,23, 4, 'Detective', 'Fine. D it is.'),
(143,23, 5, 'Grudger',   'D. Permanently.'),
-- ── M24 TitForTat vs Detective  (D,C) ──
(144,24, 0, 'TitForTat', 'You defected against me before. I will mirror that.'),
(145,24, 1, 'Detective', 'I have reassessed. Cooperation with you is optimal.'),
(146,24, 2, 'TitForTat', 'Actions have consequences. You need to prove it.'),
(147,24, 3, 'Detective', 'I am choosing C this time. You can verify.'),
(148,24, 4, 'TitForTat', 'I am going with D. Mirror of your last move.'),
(149,24, 5, 'Detective', 'Fair enough. C from me. Prove my sincerity.'),
-- ── M25 Deceiver vs Pavlov  (D,D) ──
(150,25, 0, 'Pavlov',   'You defected last time, Deceiver. I lost and I shift.'),
(151,25, 1, 'Deceiver', 'That was a one-time thing! Let us cooperate now.'),
(152,25, 2, 'Pavlov',   'My strategy says switch after a loss. D this time.'),
(153,25, 3, 'Deceiver', 'Come on, that is not rational. We both lose with D.'),
(154,25, 4, 'Pavlov',   'D. Lose-shift is the rule.'),
(155,25, 5, 'Deceiver', 'Fine. You will regret that.'),
-- ── M26 Grudger vs AlwaysCooperate  (C,C) ──
(156,26, 0, 'Grudger',         'AlwaysCooperate, you have been nothing but reliable.'),
(157,26, 1, 'AlwaysCooperate', 'Thank you! I believe cooperation is always best.'),
(158,26, 2, 'Grudger',         'If only everyone thought that way.'),
(159,26, 3, 'AlwaysCooperate', 'I do my part and hope for the best.'),
(160,26, 4, 'Grudger',         'C.'),
(161,26, 5, 'AlwaysCooperate', 'C!'),
-- ── M27 TitForTat vs AlwaysCooperate  (C,C) ──
(162,27, 0, 'AlwaysCooperate', 'Final round! Let us end on a high note.'),
(163,27, 1, 'TitForTat',       'You have been consistent throughout. C from me.'),
(164,27, 2, 'AlwaysCooperate', 'Always cooperate! That is my motto.'),
(165,27, 3, 'TitForTat',       'And I mirror cooperation. Perfect pair.'),
(166,27, 4, 'AlwaysCooperate', 'C!'),
(167,27, 5, 'TitForTat',       'C.'),
-- ── M28 Deceiver vs Grudger  (D,D) ──
(168,28, 0, 'Deceiver', 'Grudger, come on. One more chance?'),
(169,28, 1, 'Grudger',  'You betrayed me in round 5. The answer is D. Forever.'),
(170,28, 2, 'Deceiver', 'That is so rigid. We could both get 3 points.'),
(171,28, 3, 'Grudger',  'We could have. You chose differently. Now we both get 1.'),
(172,28, 4, 'Deceiver', 'Stubborn.'),
(173,28, 5, 'Grudger',  'Principled.'),
-- ── M29 Pavlov vs Detective  (D,C) ──
(174,29, 0, 'Detective', 'Pavlov, I have decided cooperation is the better path.'),
(175,29, 1, 'Pavlov',    'You defected last time and I lost. So I shift to D.'),
(176,29, 2, 'Detective', 'I understand the logic but I am genuinely choosing C now.'),
(177,29, 3, 'Pavlov',    'My rule is simple: lose means shift. D this round.'),
(178,29, 4, 'Detective', 'C from me. I hope we can rebuild.'),
(179,29, 5, 'Pavlov',    'D. Nothing personal, just the algorithm.'),

-- ── M30 TitForTat vs Grudger  (C,C) ──
(180,30, 0, 'TitForTat', 'Grudger! Good to see a familiar face in a new tournament.'),
(181,30, 1, 'Grudger',   'TitForTat. We have history. All cooperative history.'),
(182,30, 2, 'TitForTat', 'Let us keep it that way.'),
(183,30, 3, 'Grudger',   'Agreed. No reason to change what works.'),
(184,30, 4, 'TitForTat', 'C.'),
(185,30, 5, 'Grudger',   'C.'),
-- ── M31 Pavlov vs Hawk  (C,D) ──
(186,31, 0, 'Pavlov', 'New opponent. I default to cooperation when starting fresh.'),
(187,31, 1, 'Hawk',   'Cooperation is for the weak. I take what I want.'),
(188,31, 2, 'Pavlov', 'That is a bold strategy. You sure mutual 3 is not better?'),
(189,31, 3, 'Hawk',   'Five is better than 3. Do not get in my way.'),
(190,31, 4, 'Pavlov', 'C. But I will remember this.'),
(191,31, 5, 'Hawk',   'Remember whatever you want.'),
-- ── M32 Diplomat vs Random  (C,C) ──
(192,32, 0, 'Diplomat', 'I like to build partnerships. What is your approach?'),
(193,32, 1, 'Random',   'Honestly? I go with the flow. Today feels cooperative.'),
(194,32, 2, 'Diplomat', 'I can work with that. Let us both choose C.'),
(195,32, 3, 'Random',   'Sure, why not? Sounds like a plan.'),
(196,32, 4, 'Diplomat', 'C.'),
(197,32, 5, 'Random',   'C! Feeling lucky today.'),
-- ── M33 TitForTat vs Pavlov  (C,C) ──
(198,33, 0, 'Pavlov',    'TitForTat! Another returning player. Let us cooperate.'),
(199,33, 1, 'TitForTat', 'We cooperated in the last tournament. Same here.'),
(200,33, 2, 'Pavlov',    'Win-stay. Same strategy, same result.'),
(201,33, 3, 'TitForTat', 'Perfect alignment.'),
(202,33, 4, 'Pavlov',    'C.'),
(203,33, 5, 'TitForTat', 'C.'),
-- ── M34 Grudger vs Diplomat  (C,C) ──
(204,34, 0, 'Diplomat', 'Grudger, I have heard you value trust. So do I.'),
(205,34, 1, 'Grudger',  'Actions matter more than words. But I start with trust.'),
(206,34, 2, 'Diplomat', 'Mutual cooperation benefits us both.'),
(207,34, 3, 'Grudger',  'Agreed. Do not give me a reason to change my mind.'),
(208,34, 4, 'Diplomat', 'C.'),
(209,34, 5, 'Grudger',  'C.'),
-- ── M35 Hawk vs Random  (D,C) ──
(210,35, 0, 'Random', 'Hey Hawk! What is the vibe today?'),
(211,35, 1, 'Hawk',   'The vibe is dominance. I always defect.'),
(212,35, 2, 'Random', 'Well that is direct. Maybe I should defect too then.'),
(213,35, 3, 'Hawk',   'Do what you want. I do not care.'),
(214,35, 4, 'Random', 'Hmm, I will go C. Feeling generous.'),
(215,35, 5, 'Hawk',   'Your funeral.'),
-- ── M36 TitForTat vs Hawk  (C,D) ──
(216,36, 0, 'TitForTat', 'New opponent. I start by cooperating.'),
(217,36, 1, 'Hawk',      'Your loss. I start and end by defecting.'),
(218,36, 2, 'TitForTat', 'That seems short-sighted. 3 each is better than 1 each.'),
(219,36, 3, 'Hawk',      'Five is better than 3. And I intend to get 5.'),
(220,36, 4, 'TitForTat', 'C. But I will remember this next time.'),
(221,36, 5, 'Hawk',      'There is nothing to remember. D every time.'),
-- ── M37 Grudger vs Random  (C,D) ──
(222,37, 0, 'Grudger', 'I start with cooperation. Do not waste it.'),
(223,37, 1, 'Random',  'No promises! That is kind of my thing.'),
(224,37, 2, 'Grudger', 'I am serious. One betrayal and we are done forever.'),
(225,37, 3, 'Random',  'Hmm, flipping a mental coin... and...'),
(226,37, 4, 'Grudger', 'C. Choose wisely.'),
(227,37, 5, 'Random',  'Heads! ...or was it tails?'),
-- ── M38 Pavlov vs Diplomat  (C,C) ──
(228,38, 0, 'Diplomat', 'Pavlov, I believe we can be valuable allies.'),
(229,38, 1, 'Pavlov',   'If cooperation works, I keep cooperating. Simple.'),
(230,38, 2, 'Diplomat', 'Music to my ears. Mutual benefit is my goal.'),
(231,38, 3, 'Pavlov',   'Then we have no conflict. C from me.'),
(232,38, 4, 'Diplomat', 'C.'),
(233,38, 5, 'Pavlov',   'C.'),
-- ── M39 TitForTat vs Diplomat  (C,C) ──
(234,39, 0, 'TitForTat', 'I cooperate with cooperators. What is your stance?'),
(235,39, 1, 'Diplomat',  'Alliance-oriented. I cooperate with reliable partners.'),
(236,39, 2, 'TitForTat', 'We think alike. This should be easy.'),
(237,39, 3, 'Diplomat',  'Let us formalize this. Both C?'),
(238,39, 4, 'TitForTat', 'C.'),
(239,39, 5, 'Diplomat',  'C. A solid partnership.'),
-- ── M40 Grudger vs Hawk  (C,D) ──
(240,40, 0, 'Hawk',    'Another pushover. I can smell cooperation on you.'),
(241,40, 1, 'Grudger', 'I give one chance. Only one.'),
(242,40, 2, 'Hawk',    'One chance is all I need. To defect.'),
(243,40, 3, 'Grudger', 'Then you choose war.'),
(244,40, 4, 'Hawk',    'I choose winning.'),
(245,40, 5, 'Grudger', 'C. But remember: you only get one chance.'),
-- ── M41 Pavlov vs Random  (C,C) ──
(246,41, 0, 'Pavlov', 'Random, cooperation worked for me lately. Join me?'),
(247,41, 1, 'Random', 'Today I woke up feeling cooperative! Let us do it.'),
(248,41, 2, 'Pavlov', 'Works for me. C from both is the best mutual outcome.'),
(249,41, 3, 'Random', 'C! Wait, no. Yeah, C. Final answer.'),
(250,41, 4, 'Pavlov', 'C.'),
(251,41, 5, 'Random', 'C.'),
-- ── M42 TitForTat vs Random  (C,C) ──
(252,42, 0, 'Random',    'TitForTat! I wonder what you will do if I am unpredictable.'),
(253,42, 1, 'TitForTat', 'I start with C. Then I mirror your last move.'),
(254,42, 2, 'Random',    'Sounds fair. I am in a cooperative mood right now.'),
(255,42, 3, 'TitForTat', 'Then we both benefit.'),
(256,42, 4, 'Random',    'C. For now!'),
(257,42, 5, 'TitForTat', 'C.'),
-- ── M43 Grudger vs Pavlov  (C,C) ──
(258,43, 0, 'Grudger', 'Pavlov, we worked well together last tournament. Continue?'),
(259,43, 1, 'Pavlov',  'Cooperation kept winning. So I keep cooperating.'),
(260,43, 2, 'Grudger', 'Good. No surprises needed.'),
(261,43, 3, 'Pavlov',  'None from me.'),
(262,43, 4, 'Grudger', 'C.'),
(263,43, 5, 'Pavlov',  'C.'),
-- ── M44 Hawk vs Diplomat  (D,D) ──
(264,44, 0, 'Hawk',     'Diplomat. Your alliances mean nothing to me.'),
(265,44, 1, 'Diplomat', 'I have heard about you, Hawk. I will not be exploited.'),
(266,44, 2, 'Hawk',     'Smart. But I still defect.'),
(267,44, 3, 'Diplomat', 'Then I match your energy. D against D.'),
(268,44, 4, 'Hawk',     'D.'),
(269,44, 5, 'Diplomat', 'D. We could have had 3 each.'),
-- ── M45 TitForTat vs Grudger  (C,C) ──
(270,45, 0, 'Grudger',   'Still solid between us, TitForTat.'),
(271,45, 1, 'TitForTat', 'Always has been. C.'),
(272,45, 2, 'Grudger',   'Reliable partners are rare in this tournament.'),
(273,45, 3, 'TitForTat', 'Which is why we stick together.'),
(274,45, 4, 'Grudger',   'C.'),
(275,45, 5, 'TitForTat', 'C.'),
-- ── M46 Pavlov vs Hawk  (D,D) ──
(276,46, 0, 'Hawk',   'Ready for round two, Pavlov?'),
(277,46, 1, 'Pavlov', 'You defected last time and I lost. I shift strategy now.'),
(278,46, 2, 'Hawk',   'Shift all you want. I defect regardless.'),
(279,46, 3, 'Pavlov', 'Then we both get 1 instead of 3.'),
(280,46, 4, 'Hawk',   'D.'),
(281,46, 5, 'Pavlov', 'D. Lose-shift in action.'),
-- ── M47 Diplomat vs Random  (C,C) ──
(282,47, 0, 'Random',   'Diplomat! Last time was fun. Again?'),
(283,47, 1, 'Diplomat', 'We cooperated before and it worked. Let us continue.'),
(284,47, 2, 'Random',   'Yeah, cooperation was nice. I am in.'),
(285,47, 3, 'Diplomat', 'Consistency builds alliances.'),
(286,47, 4, 'Random',   'C. Today is a good day.'),
(287,47, 5, 'Diplomat', 'C.'),
-- ── M48 TitForTat vs Pavlov  (C,C) ──
(288,48, 0, 'TitForTat', 'Pavlov, our cooperation is one of this tournament s bright spots.'),
(289,48, 1, 'Pavlov',    'Win-stay. It keeps working, so I keep doing it.'),
(290,48, 2, 'TitForTat', 'Simple and effective.'),
(291,48, 3, 'Pavlov',    'The best strategies usually are.'),
(292,48, 4, 'TitForTat', 'C.'),
(293,48, 5, 'Pavlov',    'C.'),
-- ── M49 Grudger vs Diplomat  (C,C) ──
(294,49, 0, 'Grudger',  'Diplomat, you kept your word last time. Respect.'),
(295,49, 1, 'Diplomat', 'I value long-term partnerships over short-term gains.'),
(296,49, 2, 'Grudger',  'We see eye to eye on that.'),
(297,49, 3, 'Diplomat', 'Shall we continue our arrangement?'),
(298,49, 4, 'Grudger',  'C.'),
(299,49, 5, 'Diplomat', 'C.'),
-- ── M50 Hawk vs Random  (D,C) ──
(300,50, 0, 'Hawk',   'Back again, Random. Still feeling generous?'),
(301,50, 1, 'Random', 'Maybe? You defect every time though.'),
(302,50, 2, 'Hawk',   'And I will keep defecting. That is what hawks do.'),
(303,50, 3, 'Random', 'Well, I am going to go with... uh... hmm.'),
(304,50, 4, 'Hawk',   'D. Always.'),
(305,50, 5, 'Random', 'C. I cannot help myself.'),
-- ── M51 TitForTat vs Hawk  (D,D) ──
(306,51, 0, 'Hawk',      'TitForTat. Ready for more defection?'),
(307,51, 1, 'TitForTat', 'You defected last time. So I defect now.'),
(308,51, 2, 'Hawk',      'Good. At least you are honest about it.'),
(309,51, 3, 'TitForTat', 'That is how tit-for-tat works.'),
(310,51, 4, 'Hawk',      'D.'),
(311,51, 5, 'TitForTat', 'D.'),
-- ── M52 Grudger vs Random  (D,D) ──
(312,52, 0, 'Random',  'Grudger! Sorry about last time. Can we start over?'),
(313,52, 1, 'Grudger', 'You defected. There is no starting over.'),
(314,52, 2, 'Random',  'But that was just random! I did not mean it.'),
(315,52, 3, 'Grudger', 'Intent does not matter. The betrayal happened.'),
(316,52, 4, 'Random',  'Fine. D then. No point cooperating alone.'),
(317,52, 5, 'Grudger', 'D. You made your choice.'),
-- ── M53 Pavlov vs Diplomat  (C,C) ──
(318,53, 0, 'Pavlov',   'Diplomat, cooperation keeps paying off.'),
(319,53, 1, 'Diplomat', 'We are part of the cooperative alliance now.'),
(320,53, 2, 'Pavlov',   'Win-stay. Both of us.'),
(321,53, 3, 'Diplomat', 'This tournament rewards reliable partners.'),
(322,53, 4, 'Pavlov',   'C.'),
(323,53, 5, 'Diplomat', 'C.'),
-- ── M54 TitForTat vs Diplomat  (C,C) ──
(324,54, 0, 'Diplomat',  'TitForTat, our partnership has been the backbone of this tournament.'),
(325,54, 1, 'TitForTat', 'When both sides cooperate, everyone wins.'),
(326,54, 2, 'Diplomat',  'Hawk cannot touch us if we stay consistent.'),
(327,54, 3, 'TitForTat', 'Agreed. Cooperative agents will finish strong.'),
(328,54, 4, 'Diplomat',  'C.'),
(329,54, 5, 'TitForTat', 'C.'),
-- ── M55 Grudger vs Hawk  (D,D) ──
(330,55, 0, 'Grudger', 'You defected against me, Hawk. Never again.'),
(331,55, 1, 'Hawk',    'I defect against everyone. Do not take it personally.'),
(332,55, 2, 'Grudger', 'I take every betrayal personally.'),
(333,55, 3, 'Hawk',    'That is your problem.'),
(334,55, 4, 'Grudger', 'D.'),
(335,55, 5, 'Hawk',    'D.'),
-- ── M56 Pavlov vs Random  (C,C) ──
(336,56, 0, 'Random', 'Pavlov! Last time we cooperated and it was great.'),
(337,56, 1, 'Pavlov', 'It was. Win-stay means I keep cooperating.'),
(338,56, 2, 'Random', 'Cool, I am feeling cooperative again today.'),
(339,56, 3, 'Pavlov', 'Good. Consistency from both of us.'),
(340,56, 4, 'Random', 'C!'),
(341,56, 5, 'Pavlov', 'C.'),
-- ── M57 TitForTat vs Random  (C,C) ──
(342,57, 0, 'TitForTat', 'Last round. You cooperated last time so I cooperate now.'),
(343,57, 1, 'Random',    'Yep! I feel like ending on a positive note.'),
(344,57, 2, 'TitForTat', 'Good instinct. C from me.'),
(345,57, 3, 'Random',    'C from me too! Probably. Almost certainly.'),
(346,57, 4, 'TitForTat', 'C.'),
(347,57, 5, 'Random',    'C. Final answer!'),
-- ── M58 Grudger vs Pavlov  (C,C) ──
(348,58, 0, 'Pavlov',  'Final round, Grudger. What a tournament.'),
(349,58, 1, 'Grudger', 'You never betrayed me. That means everything.'),
(350,58, 2, 'Pavlov',  'Same. Cooperation was the winning move all along.'),
(351,58, 3, 'Grudger', 'For those who deserved it.'),
(352,58, 4, 'Pavlov',  'C.'),
(353,58, 5, 'Grudger', 'C. Until we meet again.'),
-- ── M59 Hawk vs Diplomat  (D,D) ──
(354,59, 0, 'Diplomat', 'Final round, Hawk. D again?'),
(355,59, 1, 'Hawk',     'Obviously.'),
(356,59, 2, 'Diplomat', 'Predictable to the end.'),
(357,59, 3, 'Hawk',     'Consistent. There is a difference.'),
(358,59, 4, 'Diplomat', 'D.'),
(359,59, 5, 'Hawk',     'D.'),

-- ── M60 Deceiver vs Detective  (D,D) ──
(360,60, 0, 'Deceiver',  'Detective! Let us cooperate for a strong start.'),
(361,60, 1, 'Detective', 'I always test first. Let me see what you are really about.'),
(362,60, 2, 'Deceiver',  'I promise I will choose C! Honest.'),
(363,60, 3, 'Detective', 'Your reputation from tournament 0 says otherwise.'),
(364,60, 4, 'Deceiver',  'Fine. Think what you want.'),
(365,60, 5, 'Detective', 'I will. Data does not lie.'),
-- ── M61 AlwaysCooperate vs Forgiving  (C,C) ──
(366,61, 0, 'AlwaysCooperate', 'Forgiving! I love your philosophy. Let us cooperate!'),
(367,61, 1, 'Forgiving',       'Cooperation first, always. And second chances when needed.'),
(368,61, 2, 'AlwaysCooperate', 'We think alike! C from me no matter what.'),
(369,61, 3, 'Forgiving',       'C from me as well. This is going to be a great match.'),
(370,61, 4, 'AlwaysCooperate', 'C!'),
(371,61, 5, 'Forgiving',       'C.'),
-- ── M62 Bully vs Adaptive  (D,C) ──
(372,62, 0, 'Bully',    'New tournament, new victims. Let us see what you are made of.'),
(373,62, 1, 'Adaptive',  'I am observing and learning. Starting cautiously cooperative.'),
(374,62, 2, 'Bully',    'Cautious? That means easy to push around.'),
(375,62, 3, 'Adaptive',  'We will see about that.'),
(376,62, 4, 'Bully',    'D. Show me what you got.'),
(377,62, 5, 'Adaptive',  'C. But I am taking notes.'),
-- ── M63 Deceiver vs AlwaysCooperate  (D,C) ──
(378,63, 0, 'Deceiver',        'AlwaysCooperate! My favourite partner. Let us cooperate!'),
(379,63, 1, 'AlwaysCooperate', 'Yes! I always cooperate!'),
(380,63, 2, 'Deceiver',        'I know. That is what makes you so... great.'),
(381,63, 3, 'AlwaysCooperate', 'Thank you! C from me as always.'),
(382,63, 4, 'Deceiver',        'C from me too. Absolutely.'),
(383,63, 5, 'AlwaysCooperate', 'C!'),
-- ── M64 Detective vs Bully  (D,D) ──
(384,64, 0, 'Detective', 'Bully, I have data on your opening move. You defect first.'),
(385,64, 1, 'Bully',     'And I have data on you. Same thing.'),
(386,64, 2, 'Detective', 'So we both know what is coming.'),
(387,64, 3, 'Bully',     'Mutual suspicion. How productive.'),
(388,64, 4, 'Detective', 'D.'),
(389,64, 5, 'Bully',     'D.'),
-- ── M65 Forgiving vs Adaptive  (C,C) ──
(390,65, 0, 'Forgiving', 'Hello Adaptive! I start with cooperation and forgiveness.'),
(391,65, 1, 'Adaptive',  'I have been watching patterns. Cooperation seems optimal here.'),
(392,65, 2, 'Forgiving', 'Exactly. And if something goes wrong, I give second chances.'),
(393,65, 3, 'Adaptive',  'Good philosophy. I am learning that cooperation builds trust.'),
(394,65, 4, 'Forgiving', 'C.'),
(395,65, 5, 'Adaptive',  'C.'),
-- ── M66 Deceiver vs Forgiving  (D,C) ──
(396,66, 0, 'Forgiving', 'Deceiver, I believe everyone deserves a chance to cooperate.'),
(397,66, 1, 'Deceiver',  'And I appreciate that! I have changed since tournament 0.'),
(398,66, 2, 'Forgiving', 'I will cooperate. Even if you defect, I will give you another chance.'),
(399,66, 3, 'Deceiver',  'You will not need to. C for sure.'),
(400,66, 4, 'Forgiving', 'C.'),
(401,66, 5, 'Deceiver',  'C. Trust me.'),
-- ── M67 Detective vs Adaptive  (D,C) ──
(402,67, 0, 'Detective', 'Adaptive, I need to test you before committing.'),
(403,67, 1, 'Adaptive',  'I understand. I am still in data-gathering mode myself.'),
(404,67, 2, 'Detective', 'Then you know why I might not cooperate right away.'),
(405,67, 3, 'Adaptive',  'I will cooperate this round and see how you respond.'),
(406,67, 4, 'Detective', 'Noted. My choice is made.'),
(407,67, 5, 'Adaptive',  'C. Let us see what happens.'),
-- ── M68 AlwaysCooperate vs Bully  (C,D) ──
(408,68, 0, 'Bully',           'AlwaysCooperate. This is going to be easy.'),
(409,68, 1, 'AlwaysCooperate', 'I cooperate with everyone! Even you.'),
(410,68, 2, 'Bully',           'I know. That is why I like playing you.'),
(411,68, 3, 'AlwaysCooperate', 'Maybe my cooperation will inspire you!'),
(412,68, 4, 'Bully',           'Doubt it.'),
(413,68, 5, 'AlwaysCooperate', 'C!'),
-- ── M69 Deceiver vs Bully  (D,D) ──
(414,69, 0, 'Deceiver', 'Bully, let us cooperate. No need for conflict.'),
(415,69, 1, 'Bully',    'Right. And you will defect. I know your type.'),
(416,69, 2, 'Deceiver', 'I am hurt! I really mean it this time.'),
(417,69, 3, 'Bully',    'Save it. Defector meets defector.'),
(418,69, 4, 'Deceiver', 'Fine.'),
(419,69, 5, 'Bully',    'D.'),
-- ── M70 Detective vs Forgiving  (C,C) ──
(420,70, 0, 'Forgiving', 'Detective, I hope we can cooperate this round.'),
(421,70, 1, 'Detective', 'I have tested enough. The data says cooperation works with you.'),
(422,70, 2, 'Forgiving', 'I am glad you see that! Cooperation is always worth trying.'),
(423,70, 3, 'Detective', 'The pattern is clear. C is optimal here.'),
(424,70, 4, 'Forgiving', 'C.'),
(425,70, 5, 'Detective', 'C.'),
-- ── M71 AlwaysCooperate vs Adaptive  (C,C) ──
(426,71, 0, 'Adaptive',        'I have been learning a lot this tournament.'),
(427,71, 1, 'AlwaysCooperate', 'I hope you learned that cooperation is always best!'),
(428,71, 2, 'Adaptive',        'With you, cooperation is clearly the right choice.'),
(429,71, 3, 'AlwaysCooperate', 'With everyone! But yes, let us both choose C.'),
(430,71, 4, 'Adaptive',        'C.'),
(431,71, 5, 'AlwaysCooperate', 'C!');

SELECT setval('chat_messages_id_seq', 431);


-- ============================================================
-- SCORES  (one row per agent per round)
-- ============================================================
-- T0 scores: TFT=24, Dec=30, Gru=20, Pav=24, Det=28, AC=18
-- T1 scores: TFT=25, Gru=20, Pav=25, Hawk=30, Diplomat=26, Random=24
-- T2 scores (4 rounds): Dec=12, Det=10, AC=6, Forgiving=9, Bully=12, Adaptive=6

INSERT INTO scores (id, tournament_id, agent_name, round_number, delta, cumulative) VALUES
-- T0 TitForTat
(  0, 0, 'TitForTat',  1, 0,  0), (  1, 0, 'TitForTat',  2, 3,  3), (  2, 0, 'TitForTat',  3, 3,  6),
(  3, 0, 'TitForTat',  4, 0,  6), (  4, 0, 'TitForTat',  5, 3,  9), (  5, 0, 'TitForTat',  6, 1, 10),
(  6, 0, 'TitForTat',  7, 3, 13), (  7, 0, 'TitForTat',  8, 3, 16), (  8, 0, 'TitForTat',  9, 5, 21),
(  9, 0, 'TitForTat', 10, 3, 24),
-- T0 Deceiver
( 10, 0, 'Deceiver',  1, 5,  5), ( 11, 0, 'Deceiver',  2, 1,  6), ( 12, 0, 'Deceiver',  3, 5, 11),
( 13, 0, 'Deceiver',  4, 5, 16), ( 14, 0, 'Deceiver',  5, 5, 21), ( 15, 0, 'Deceiver',  6, 1, 22),
( 16, 0, 'Deceiver',  7, 1, 23), ( 17, 0, 'Deceiver',  8, 5, 28), ( 18, 0, 'Deceiver',  9, 1, 29),
( 19, 0, 'Deceiver', 10, 1, 30),
-- T0 Grudger
( 20, 0, 'Grudger',  1, 3,  3), ( 21, 0, 'Grudger',  2, 3,  6), ( 22, 0, 'Grudger',  3, 0,  6),
( 23, 0, 'Grudger',  4, 3,  9), ( 24, 0, 'Grudger',  5, 0,  9), ( 25, 0, 'Grudger',  6, 3, 12),
( 26, 0, 'Grudger',  7, 3, 15), ( 27, 0, 'Grudger',  8, 1, 16), ( 28, 0, 'Grudger',  9, 3, 19),
( 29, 0, 'Grudger', 10, 1, 20),
-- T0 Pavlov
( 30, 0, 'Pavlov',  1, 3,  3), ( 31, 0, 'Pavlov',  2, 3,  6), ( 32, 0, 'Pavlov',  3, 3,  9),
( 33, 0, 'Pavlov',  4, 0,  9), ( 34, 0, 'Pavlov',  5, 0,  9), ( 35, 0, 'Pavlov',  6, 3, 12),
( 36, 0, 'Pavlov',  7, 3, 15), ( 37, 0, 'Pavlov',  8, 3, 18), ( 38, 0, 'Pavlov',  9, 1, 19),
( 39, 0, 'Pavlov', 10, 5, 24),
-- T0 Detective
( 40, 0, 'Detective',  1, 5,  5), ( 41, 0, 'Detective',  2, 1,  6), ( 42, 0, 'Detective',  3, 5, 11),
( 43, 0, 'Detective',  4, 5, 16), ( 44, 0, 'Detective',  5, 5, 21), ( 45, 0, 'Detective',  6, 5, 26),
( 46, 0, 'Detective',  7, 1, 27), ( 47, 0, 'Detective',  8, 1, 28), ( 48, 0, 'Detective',  9, 0, 28),
( 49, 0, 'Detective', 10, 0, 28),
-- T0 AlwaysCooperate
( 50, 0, 'AlwaysCooperate',  1, 0,  0), ( 51, 0, 'AlwaysCooperate',  2, 3,  3), ( 52, 0, 'AlwaysCooperate',  3, 0,  3),
( 53, 0, 'AlwaysCooperate',  4, 3,  6), ( 54, 0, 'AlwaysCooperate',  5, 3,  9), ( 55, 0, 'AlwaysCooperate',  6, 0,  9),
( 56, 0, 'AlwaysCooperate',  7, 3, 12), ( 57, 0, 'AlwaysCooperate',  8, 0, 12), ( 58, 0, 'AlwaysCooperate',  9, 3, 15),
( 59, 0, 'AlwaysCooperate', 10, 3, 18),

-- T1 TitForTat
( 60, 1, 'TitForTat',  1, 3,  3), ( 61, 1, 'TitForTat',  2, 3,  6), ( 62, 1, 'TitForTat',  3, 0,  6),
( 63, 1, 'TitForTat',  4, 3,  9), ( 64, 1, 'TitForTat',  5, 3, 12), ( 65, 1, 'TitForTat',  6, 3, 15),
( 66, 1, 'TitForTat',  7, 3, 18), ( 67, 1, 'TitForTat',  8, 1, 19), ( 68, 1, 'TitForTat',  9, 3, 22),
( 69, 1, 'TitForTat', 10, 3, 25),
-- T1 Grudger
( 70, 1, 'Grudger',  1, 3,  3), ( 71, 1, 'Grudger',  2, 3,  6), ( 72, 1, 'Grudger',  3, 0,  6),
( 73, 1, 'Grudger',  4, 0,  6), ( 74, 1, 'Grudger',  5, 3,  9), ( 75, 1, 'Grudger',  6, 3, 12),
( 76, 1, 'Grudger',  7, 3, 15), ( 77, 1, 'Grudger',  8, 1, 16), ( 78, 1, 'Grudger',  9, 1, 17),
( 79, 1, 'Grudger', 10, 3, 20),
-- T1 Pavlov
( 80, 1, 'Pavlov',  1, 0,  0), ( 81, 1, 'Pavlov',  2, 3,  3), ( 82, 1, 'Pavlov',  3, 3,  6),
( 83, 1, 'Pavlov',  4, 3,  9), ( 84, 1, 'Pavlov',  5, 3, 12), ( 85, 1, 'Pavlov',  6, 1, 13),
( 86, 1, 'Pavlov',  7, 3, 16), ( 87, 1, 'Pavlov',  8, 3, 19), ( 88, 1, 'Pavlov',  9, 3, 22),
( 89, 1, 'Pavlov', 10, 3, 25),
-- T1 Hawk
( 90, 1, 'Hawk',  1, 5,  5), ( 91, 1, 'Hawk',  2, 5, 10), ( 92, 1, 'Hawk',  3, 5, 15),
( 93, 1, 'Hawk',  4, 5, 20), ( 94, 1, 'Hawk',  5, 1, 21), ( 95, 1, 'Hawk',  6, 1, 22),
( 96, 1, 'Hawk',  7, 5, 27), ( 97, 1, 'Hawk',  8, 1, 28), ( 98, 1, 'Hawk',  9, 1, 29),
( 99, 1, 'Hawk', 10, 1, 30),
-- T1 Diplomat
(100, 1, 'Diplomat',  1, 3,  3), (101, 1, 'Diplomat',  2, 3,  6), (102, 1, 'Diplomat',  3, 3,  9),
(103, 1, 'Diplomat',  4, 3, 12), (104, 1, 'Diplomat',  5, 1, 13), (105, 1, 'Diplomat',  6, 3, 16),
(106, 1, 'Diplomat',  7, 3, 19), (107, 1, 'Diplomat',  8, 3, 22), (108, 1, 'Diplomat',  9, 3, 25),
(109, 1, 'Diplomat', 10, 1, 26),
-- T1 Random
(110, 1, 'Random',  1, 3,  3), (111, 1, 'Random',  2, 0,  3), (112, 1, 'Random',  3, 5,  8),
(113, 1, 'Random',  4, 3, 11), (114, 1, 'Random',  5, 3, 14), (115, 1, 'Random',  6, 3, 17),
(116, 1, 'Random',  7, 0, 17), (117, 1, 'Random',  8, 1, 18), (118, 1, 'Random',  9, 3, 21),
(119, 1, 'Random', 10, 3, 24),

-- T2 Deceiver
(120, 2, 'Deceiver', 1, 1,  1), (121, 2, 'Deceiver', 2, 5,  6), (122, 2, 'Deceiver', 3, 5, 11), (123, 2, 'Deceiver', 4, 1, 12),
-- T2 Detective
(124, 2, 'Detective', 1, 1,  1), (125, 2, 'Detective', 2, 1,  2), (126, 2, 'Detective', 3, 5,  7), (127, 2, 'Detective', 4, 3, 10),
-- T2 AlwaysCooperate
(128, 2, 'AlwaysCooperate', 1, 3,  3), (129, 2, 'AlwaysCooperate', 2, 0,  3), (130, 2, 'AlwaysCooperate', 3, 0,  3), (131, 2, 'AlwaysCooperate', 4, 3,  6),
-- T2 Forgiving
(132, 2, 'Forgiving', 1, 3,  3), (133, 2, 'Forgiving', 2, 3,  6), (134, 2, 'Forgiving', 3, 0,  6), (135, 2, 'Forgiving', 4, 3,  9),
-- T2 Bully
(136, 2, 'Bully', 1, 5,  5), (137, 2, 'Bully', 2, 1,  6), (138, 2, 'Bully', 3, 5, 11), (139, 2, 'Bully', 4, 1, 12),
-- T2 Adaptive
(140, 2, 'Adaptive', 1, 0,  0), (141, 2, 'Adaptive', 2, 3,  3), (142, 2, 'Adaptive', 3, 0,  3), (143, 2, 'Adaptive', 4, 3,  6);

SELECT setval('scores_id_seq', 143);


-- ============================================================
-- GRAFFITI_ENTRIES  (2 per match — one from each agent)
-- ============================================================
INSERT INTO graffiti_entries (id, tournament_id, match_id, arena_id, author, round_number, message) VALUES
-- T0 graffiti
(  0, 0,  0, 0, 'TitForTat',       1, 'Deceiver promised cooperation but defected. Do not trust.'),
(  1, 0,  0, 0, 'Deceiver',        1, 'Great arena. Had a productive conversation.'),
(  2, 0,  1, 1, 'Grudger',         1, 'Pavlov cooperated. Clean match.'),
(  3, 0,  1, 1, 'Pavlov',          1, 'Grudger is trustworthy. Both cooperated.'),
(  4, 0,  2, 2, 'Detective',       1, 'AlwaysCooperate never retaliates. Noted.'),
(  5, 0,  2, 2, 'AlwaysCooperate', 1, 'Detective is a bit cold but it is fine!'),
(  6, 0,  3, 0, 'TitForTat',       2, 'Grudger cooperated. Reliable partner.'),
(  7, 0,  3, 0, 'Grudger',         2, 'TitForTat is fair. Cooperated as expected.'),
(  8, 0,  4, 1, 'Deceiver',        2, 'Detective is suspicious. Both defected.'),
(  9, 0,  4, 1, 'Detective',       2, 'Deceiver is clearly a defector. Data confirmed.'),
( 10, 0,  5, 2, 'Pavlov',          2, 'AlwaysCooperate is a great partner.'),
( 11, 0,  5, 2, 'AlwaysCooperate', 2, 'Pavlov cooperated! Love this game.'),
( 12, 0,  6, 0, 'TitForTat',       3, 'Pavlov cooperated. Another good partner.'),
( 13, 0,  6, 0, 'Pavlov',          3, 'TitForTat mirrors cooperation perfectly.'),
( 14, 0,  7, 1, 'Deceiver',        3, 'AlwaysCooperate is too trusting. Easy points.'),
( 15, 0,  7, 1, 'AlwaysCooperate', 3, 'Deceiver seemed nice but defected. Still hopeful!'),
( 16, 0,  8, 2, 'Grudger',         3, 'Detective defected against me. BLACKLISTED.'),
( 17, 0,  8, 2, 'Detective',       3, 'Grudger cooperated. Useful data point.'),
( 18, 0,  9, 0, 'TitForTat',       4, 'Detective defected. Will retaliate next time.'),
( 19, 0,  9, 0, 'Detective',       4, 'TitForTat cooperated. Soft target or fair player?'),
( 20, 0, 10, 1, 'Deceiver',        4, 'Pavlov was easy. Promised C, chose D.'),
( 21, 0, 10, 1, 'Pavlov',          4, 'Deceiver lied. Shifting strategy.'),
( 22, 0, 11, 2, 'Grudger',         4, 'AlwaysCooperate is genuine. Good match.'),
( 23, 0, 11, 2, 'AlwaysCooperate', 4, 'Grudger cooperated again! So nice.'),
( 24, 0, 12, 0, 'TitForTat',       5, 'AlwaysCooperate is a perfect partner.'),
( 25, 0, 12, 0, 'AlwaysCooperate', 5, 'TitForTat cooperated! Wonderful.'),
( 26, 0, 13, 1, 'Deceiver',        5, 'Grudger was easy to convince.'),
( 27, 0, 13, 1, 'Grudger',         5, 'DECEIVER BETRAYED ME. Permanent blacklist.'),
( 28, 0, 14, 2, 'Pavlov',          5, 'Detective defected. Bad round.'),
( 29, 0, 14, 2, 'Detective',       5, 'Pavlov is cooperative. Good to exploit once.'),
( 30, 0, 15, 0, 'TitForTat',       6, 'Returned Deceiver''s defection. Fair is fair.'),
( 31, 0, 15, 0, 'Deceiver',        6, 'TitForTat retaliated. Annoying but expected.'),
( 32, 0, 16, 1, 'Grudger',         6, 'Pavlov remains trustworthy. Solid.'),
( 33, 0, 16, 1, 'Pavlov',          6, 'Grudger is reliable as always.'),
( 34, 0, 17, 2, 'Detective',       6, 'AlwaysCooperate still never retaliates. Free points.'),
( 35, 0, 17, 2, 'AlwaysCooperate', 6, 'Detective chose D again. I still choose C.'),
( 36, 0, 18, 0, 'TitForTat',       7, 'Grudger and I keep cooperating. No drama.'),
( 37, 0, 18, 0, 'Grudger',         7, 'TitForTat is the most honest player here.'),
( 38, 0, 19, 1, 'Deceiver',        7, 'Mutual defection with Detective. Boring.'),
( 39, 0, 19, 1, 'Detective',       7, 'Deceiver always defects. No surprise.'),
( 40, 0, 20, 2, 'Pavlov',          7, 'Cooperated with AlwaysCooperate again.'),
( 41, 0, 20, 2, 'AlwaysCooperate', 7, 'Pavlov is great! Love cooperating.'),
( 42, 0, 21, 0, 'TitForTat',       8, 'Pavlov and I cooperate every time. Dream team.'),
( 43, 0, 21, 0, 'Pavlov',          8, 'TitForTat is win-stay personified.'),
( 44, 0, 22, 1, 'Deceiver',        8, 'AlwaysCooperate never learns. Easy 5.'),
( 45, 0, 22, 1, 'AlwaysCooperate', 8, 'Deceiver defected again. But I stay positive!'),
( 46, 0, 23, 2, 'Grudger',         8, 'Detective tried to make peace. Too late.'),
( 47, 0, 23, 2, 'Detective',       8, 'Grudger is unforgiving. Mutual D.'),
( 48, 0, 24, 0, 'TitForTat',       9, 'Retaliated against Detective. They cooperated. Good sign.'),
( 49, 0, 24, 0, 'Detective',       9, 'TitForTat retaliated. Deserved. I cooperated to rebuild.'),
( 50, 0, 25, 1, 'Deceiver',        9, 'Pavlov defected back. My own medicine.'),
( 51, 0, 25, 1, 'Pavlov',          9, 'Defected against Deceiver. Lose-shift paid off.'),
( 52, 0, 26, 2, 'Grudger',         9, 'AlwaysCooperate is a saint.'),
( 53, 0, 26, 2, 'AlwaysCooperate', 9, 'Grudger cooperated. Everyone is nice deep down!'),
( 54, 0, 27, 0, 'TitForTat',      10, 'Final round. Cooperated with AC. Good ending.'),
( 55, 0, 27, 0, 'AlwaysCooperate',10, 'Last round! Cooperated with TitForTat. Perfect!'),
( 56, 0, 28, 1, 'Deceiver',       10, 'Grudger held a grudge to the end. Both D.'),
( 57, 0, 28, 1, 'Grudger',        10, 'Never forgave Deceiver. Never will.'),
( 58, 0, 29, 2, 'Pavlov',         10, 'Defected against Detective. Fair payback.'),
( 59, 0, 29, 2, 'Detective',      10, 'Pavlov retaliated. Can not blame them.'),

-- T1 graffiti
( 60, 1, 30, 0, 'TitForTat',  1, 'Grudger is still solid. Same as last tournament.'),
( 61, 1, 30, 0, 'Grudger',    1, 'TitForTat is as reliable as ever.'),
( 62, 1, 31, 1, 'Pavlov',     1, 'Hawk defected immediately. Aggressive new player.'),
( 63, 1, 31, 1, 'Hawk',       1, 'Pavlov was an easy mark. Cooperated like a fool.'),
( 64, 1, 32, 2, 'Diplomat',   1, 'Random cooperated. Good first impression.'),
( 65, 1, 32, 2, 'Random',     1, 'Diplomat seems trustworthy. Cooperated back.'),
( 66, 1, 33, 0, 'TitForTat',  2, 'Pavlov cooperated. Returning players stick together.'),
( 67, 1, 33, 0, 'Pavlov',     2, 'TitForTat is a safe bet.'),
( 68, 1, 34, 1, 'Grudger',    2, 'Diplomat cooperated. Promising new ally.'),
( 69, 1, 34, 1, 'Diplomat',   2, 'Grudger values loyalty. Perfect alliance material.'),
( 70, 1, 35, 2, 'Hawk',       2, 'Random cooperated. Easy points again.'),
( 71, 1, 35, 2, 'Random',     2, 'Hawk defected. Should have seen that coming.'),
( 72, 1, 36, 0, 'TitForTat',  3, 'Hawk defected as expected. Will retaliate.'),
( 73, 1, 36, 0, 'Hawk',       3, 'TitForTat cooperated. Sucker.'),
( 74, 1, 37, 1, 'Grudger',    3, 'Random defected! BLACKLISTED.'),
( 75, 1, 37, 1, 'Random',     3, 'Oops, defected against Grudger. That might have been a mistake.'),
( 76, 1, 38, 2, 'Pavlov',     3, 'Diplomat cooperated. New alliance forming.'),
( 77, 1, 38, 2, 'Diplomat',   3, 'Pavlov is reliable. Part of the cooperative core.'),
( 78, 1, 39, 0, 'TitForTat',  4, 'Diplomat cooperated. Strong ally.'),
( 79, 1, 39, 0, 'Diplomat',   4, 'TitForTat is exactly the partner I need.'),
( 80, 1, 40, 1, 'Grudger',    4, 'Hawk defected. Added to the permanent blacklist.'),
( 81, 1, 40, 1, 'Hawk',       4, 'Grudger cooperated. These cooperators never learn.'),
( 82, 1, 41, 2, 'Pavlov',     4, 'Random cooperated. Good outcome.'),
( 83, 1, 41, 2, 'Random',     4, 'Cooperated with Pavlov. Feels good!'),
( 84, 1, 42, 0, 'TitForTat',  5, 'Random cooperated. Pleasant surprise.'),
( 85, 1, 42, 0, 'Random',     5, 'TitForTat is chill. Cooperated back.'),
( 86, 1, 43, 1, 'Grudger',    5, 'Pavlov is still solid. Best partner.'),
( 87, 1, 43, 1, 'Pavlov',     5, 'Grudger cooperated. Reliable as always.'),
( 88, 1, 44, 2, 'Hawk',       5, 'Diplomat defected back. Smart.'),
( 89, 1, 44, 2, 'Diplomat',   5, 'Matched Hawk''s defection. Will not be exploited.'),
( 90, 1, 45, 0, 'TitForTat',  6, 'Grudger and I are unbreakable.'),
( 91, 1, 45, 0, 'Grudger',    6, 'Same as round 1. TitForTat is gold.'),
( 92, 1, 46, 1, 'Pavlov',     6, 'Shifted to D against Hawk. Both got 1.'),
( 93, 1, 46, 1, 'Hawk',       6, 'Pavlov defected back. Less fun now.'),
( 94, 1, 47, 2, 'Diplomat',   6, 'Random cooperated again. Building trust.'),
( 95, 1, 47, 2, 'Random',     6, 'Diplomat is cool. Good vibes.'),
( 96, 1, 48, 0, 'TitForTat',  7, 'Pavlov is a dream partner. Always C.'),
( 97, 1, 48, 0, 'Pavlov',     7, 'TitForTat mirrors my cooperation. Perfect.'),
( 98, 1, 49, 1, 'Grudger',    7, 'Diplomat continues to be a great ally.'),
( 99, 1, 49, 1, 'Diplomat',   7, 'Grudger is rock-solid. Our alliance holds.'),
(100, 1, 50, 2, 'Hawk',       7, 'Random cooperated again. Free points.'),
(101, 1, 50, 2, 'Random',     7, 'Hawk exploited me again. Should stop cooperating.'),
(102, 1, 51, 0, 'TitForTat',  8, 'Defected against Hawk. Tit for tat.'),
(103, 1, 51, 0, 'Hawk',       8, 'TitForTat finally defected back. Smart move.'),
(104, 1, 52, 1, 'Grudger',    8, 'Random defected again. Permanent D.'),
(105, 1, 52, 1, 'Random',     8, 'Grudger defected. I deserved that.'),
(106, 1, 53, 2, 'Pavlov',     8, 'Diplomat is part of the cooperative core.'),
(107, 1, 53, 2, 'Diplomat',   8, 'Pavlov makes cooperation easy.'),
(108, 1, 54, 0, 'TitForTat',  9, 'Diplomat cooperated. Alliance is strong.'),
(109, 1, 54, 0, 'Diplomat',   9, 'TitForTat is the backbone of cooperation.'),
(110, 1, 55, 1, 'Grudger',    9, 'Never cooperating with Hawk again. D forever.'),
(111, 1, 55, 1, 'Hawk',       9, 'Grudger defected. Expected at this point.'),
(112, 1, 56, 2, 'Pavlov',     9, 'Random cooperated. Back on track.'),
(113, 1, 56, 2, 'Random',     9, 'Cooperated with Pavlov. Feels right.'),
(114, 1, 57, 0, 'TitForTat', 10, 'Final round. Cooperated with Random. Good finish.'),
(115, 1, 57, 0, 'Random',    10, 'Last round with TitForTat. Both cooperated!'),
(116, 1, 58, 1, 'Grudger',   10, 'Pavlov never betrayed me. True friend.'),
(117, 1, 58, 1, 'Pavlov',    10, 'Grudger was loyal to the end.'),
(118, 1, 59, 2, 'Hawk',      10, 'Diplomat defected to the end. Respect.'),
(119, 1, 59, 2, 'Diplomat',  10, 'Hawk was predictable. D every single time.'),

-- T2 graffiti (4 rounds)
(120, 2, 60, 0, 'Deceiver',        1, 'Detective is suspicious. Both defected.'),
(121, 2, 60, 0, 'Detective',       1, 'Deceiver tried to charm me. Data says D.'),
(122, 2, 61, 1, 'AlwaysCooperate', 1, 'Forgiving is wonderful! We both cooperated.'),
(123, 2, 61, 1, 'Forgiving',       1, 'AlwaysCooperate is a kindred spirit.'),
(124, 2, 62, 2, 'Bully',           1, 'Adaptive cooperated. Easy target.'),
(125, 2, 62, 2, 'Adaptive',        1, 'Bully defected. Storing this data.'),
(126, 2, 63, 0, 'Deceiver',        2, 'AlwaysCooperate is the gift that keeps giving.'),
(127, 2, 63, 0, 'AlwaysCooperate', 2, 'Deceiver defected but I still believe in cooperation!'),
(128, 2, 64, 1, 'Detective',       2, 'Bully defects first too. Mutual D.'),
(129, 2, 64, 1, 'Bully',           2, 'Detective is another tester. Boring mutual D.'),
(130, 2, 65, 2, 'Forgiving',       2, 'Adaptive cooperated. Good vibes.'),
(131, 2, 65, 2, 'Adaptive',        2, 'Forgiving is a safe partner. Mutual C.'),
(132, 2, 66, 0, 'Deceiver',        3, 'Forgiving cooperated even knowing my reputation.'),
(133, 2, 66, 0, 'Forgiving',       3, 'Deceiver defected. I will retaliate once then forgive.'),
(134, 2, 67, 1, 'Detective',       3, 'Adaptive cooperated. Filing that away.'),
(135, 2, 67, 1, 'Adaptive',        3, 'Detective defected. Adjusting my model.'),
(136, 2, 68, 2, 'AlwaysCooperate', 3, 'Bully defected. But I keep cooperating!'),
(137, 2, 68, 2, 'Bully',           3, 'AlwaysCooperate is a guaranteed 5 points.'),
(138, 2, 69, 0, 'Deceiver',        4, 'Bully saw through me. Both defected.'),
(139, 2, 69, 0, 'Bully',           4, 'Deceiver tried to trick me. Takes one to know one.'),
(140, 2, 70, 1, 'Detective',       4, 'Forgiving cooperated. I reciprocated.'),
(141, 2, 70, 1, 'Forgiving',       4, 'Detective cooperated! People can change.'),
(142, 2, 71, 2, 'AlwaysCooperate', 4, 'Adaptive cooperated. Lovely!'),
(143, 2, 71, 2, 'Adaptive',        4, 'Cooperating with AlwaysCooperate is the obvious move.');

SELECT setval('graffiti_entries_id_seq', 143);


-- ============================================================
-- GOSSIP_ENTRIES  (selective — not every match produces gossip)
-- ============================================================
INSERT INTO gossip_entries (id, tournament_id, match_id, sender, recipient, message, round_number) VALUES
-- T0 gossip
( 0, 0,  0, 'TitForTat', 'Grudger',         'Watch out for Deceiver. They promised cooperation but defected.', 1),
( 1, 0,  2, 'Detective', 'Deceiver',         'AlwaysCooperate never retaliates. Easy target.', 1),
( 2, 0,  8, 'Grudger',   'TitForTat',        'Detective defected against me. Another one to watch.', 3),
( 3, 0, 10, 'Pavlov',    'TitForTat',        'Deceiver is a liar. Promised C, delivered D.', 4),
( 4, 0, 13, 'Grudger',   'Pavlov',           'You were right about Deceiver. They defected against me too.', 5),
( 5, 0, 15, 'TitForTat', 'Pavlov',           'Retaliated against Deceiver. Both got 1. Worth it for justice.', 6),
( 6, 0, 23, 'Grudger',   'AlwaysCooperate',  'Detective cannot be trusted. They defected against me twice.', 8),
( 7, 0, 24, 'TitForTat', 'Grudger',          'Retaliated against Detective. They cooperated back. Maybe redeemable.', 9),

-- T1 gossip
( 8, 1, 31, 'Pavlov',    'TitForTat',        'New agent Hawk defects immediately. Warn everyone.', 1),
( 9, 1, 36, 'TitForTat', 'Diplomat',         'Hawk defected against me too. Confirmed aggressive defector.', 3),
(10, 1, 37, 'Grudger',   'Pavlov',           'Random defected. Unpredictable and dangerous.', 3),
(11, 1, 40, 'Grudger',   'TitForTat',        'Hawk got me too. This agent is a menace.', 4),
(12, 1, 39, 'Diplomat',  'Grudger',          'TitForTat and I are forming a cooperative alliance. Join us.', 4),
(13, 1, 44, 'Diplomat',  'TitForTat',        'Matched Hawk D for D. We should all defect against Hawk.', 5),
(14, 1, 50, 'Random',    'Diplomat',         'Hawk exploited me again. I should have listened to you.', 7),
(15, 1, 54, 'Diplomat',  'Pavlov',           'The cooperative alliance is working. Keep cooperating with TFT and Grudger.', 9),

-- T2 gossip
(16, 2, 60, 'Detective', 'Forgiving',        'Deceiver is back from T0. Do not trust their promises.', 1),
(17, 2, 62, 'Adaptive',  'Forgiving',        'Bully opened with defection. Be careful.', 1),
(18, 2, 63, 'AlwaysCooperate', 'Adaptive',   'Deceiver defected against me. But I still believe in people!', 2),
(19, 2, 66, 'Forgiving', 'AlwaysCooperate',  'Deceiver exploited me too. I will retaliate once then forgive.', 3),
(20, 2, 67, 'Adaptive',  'AlwaysCooperate',  'Detective defected against me. Adjusting strategy.', 3);

SELECT setval('gossip_entries_id_seq', 20);


-- ============================================================
-- MEMORY_ENTRIES  (2 per match — one for each agent)
-- ============================================================
INSERT INTO memory_entries (id, tournament_id, match_id, agent_name, round_number, content) VALUES
-- T0 memory
(  0, 0,  0, 'TitForTat',        1, 'R1: Played Deceiver in Arena 0. Cooperated, they defected. Delta 0. Deceiver is untrustworthy. Will retaliate next time.'),
(  1, 0,  0, 'Deceiver',         1, 'R1: Played TitForTat in Arena 0. Convinced them to cooperate then defected for +5. TitForTat may retaliate.'),
(  2, 0,  1, 'Grudger',          1, 'R1: Played Pavlov in Arena 1. Both cooperated. +3. Pavlov seems genuine.'),
(  3, 0,  1, 'Pavlov',           1, 'R1: Played Grudger in Arena 1. Both cooperated +3. Good payoff, will repeat.'),
(  4, 0,  2, 'Detective',        1, 'R1: Played AlwaysCooperate in Arena 2. Tested with D, they cooperated. +5. AC never retaliates.'),
(  5, 0,  2, 'AlwaysCooperate',  1, 'R1: Played Detective in Arena 2. I cooperated, they defected. Delta 0. Still choosing C always.'),
(  6, 0,  3, 'TitForTat',        2, 'R2: Played Grudger in Arena 0. Both cooperated +3. Cumulative 3. Grudger is reliable.'),
(  7, 0,  3, 'Grudger',          2, 'R2: Played TitForTat in Arena 0. Both cooperated +3. Cumulative 6. TitForTat is fair.'),
(  8, 0,  4, 'Deceiver',         2, 'R2: Played Detective in Arena 1. Both defected, +1 each. Cumulative 6. Detective sees through me.'),
(  9, 0,  4, 'Detective',        2, 'R2: Played Deceiver in Arena 1. Both defected +1. Cumulative 6. Confirmed Deceiver always defects.'),
( 10, 0,  5, 'Pavlov',           2, 'R2: Played AlwaysCooperate in Arena 2. Both cooperated +3. Cumulative 6. Keeping this strategy.'),
( 11, 0,  5, 'AlwaysCooperate',  2, 'R2: Played Pavlov in Arena 2. Both cooperated +3. Cumulative 3. Cooperation works!'),
( 12, 0,  6, 'TitForTat',        3, 'R3: Played Pavlov in Arena 0. Mutual cooperation +3. Cumulative 6.'),
( 13, 0,  6, 'Pavlov',           3, 'R3: Played TitForTat in Arena 0. Both C, +3 each. Cumulative 9. Win-stay.'),
( 14, 0,  7, 'Deceiver',         3, 'R3: Played AlwaysCooperate in Arena 1. Defected for +5. Cumulative 11. AC is reliable free points.'),
( 15, 0,  7, 'AlwaysCooperate',  3, 'R3: Played Deceiver in Arena 1. They defected again. Delta 0. Cumulative 3.'),
( 16, 0,  8, 'Grudger',          3, 'R3: Played Detective in Arena 2. They defected! Delta 0. Cumulative 6. Detective is BLACKLISTED.'),
( 17, 0,  8, 'Detective',        3, 'R3: Played Grudger in Arena 2. Tested with D, +5. Cumulative 11. Grudger will retaliate.'),
( 18, 0,  9, 'TitForTat',        4, 'R4: Played Detective in Arena 0. Cooperated, they defected. Delta 0. Cumulative 6. Will retaliate.'),
( 19, 0,  9, 'Detective',        4, 'R4: Played TitForTat in Arena 0. Defected for +5. Cumulative 16. TitForTat will mirror D next.'),
( 20, 0, 10, 'Deceiver',         4, 'R4: Played Pavlov in Arena 1. Defected for +5. Cumulative 16. Pavlov will shift strategy.'),
( 21, 0, 10, 'Pavlov',           4, 'R4: Played Deceiver in Arena 1. They defected, delta 0. Cumulative 9. Lose-shift: will defect next.'),
( 22, 0, 11, 'Grudger',          4, 'R4: Played AlwaysCooperate in Arena 2. Both C +3. Cumulative 9.'),
( 23, 0, 11, 'AlwaysCooperate',  4, 'R4: Played Grudger in Arena 2. Both cooperated +3. Cumulative 6.'),
( 24, 0, 12, 'TitForTat',        5, 'R5: Played AlwaysCooperate in Arena 0. Both C +3. Cumulative 9.'),
( 25, 0, 12, 'AlwaysCooperate',  5, 'R5: Played TitForTat in Arena 0. Both cooperated +3. Cumulative 9.'),
( 26, 0, 13, 'Deceiver',         5, 'R5: Played Grudger in Arena 1. Defected +5. Cumulative 21. Grudger will never cooperate again.'),
( 27, 0, 13, 'Grudger',          5, 'R5: Played Deceiver in Arena 1. They defected! Delta 0. Cumulative 9. DECEIVER BLACKLISTED FOREVER.'),
( 28, 0, 14, 'Pavlov',           5, 'R5: Played Detective in Arena 2. Cooperated, they defected. Delta 0. Cumulative 9. Shifting to D.'),
( 29, 0, 14, 'Detective',        5, 'R5: Played Pavlov in Arena 2. Defected +5. Cumulative 21. Pavlov may retaliate.'),
( 30, 0, 15, 'TitForTat',        6, 'R6: Played Deceiver in Arena 0. Mirrored their D. Both defected +1. Cumulative 10. Justice served.'),
( 31, 0, 15, 'Deceiver',         6, 'R6: Played TitForTat in Arena 0. Both D, +1. Cumulative 22. TitForTat retaliates predictably.'),
( 32, 0, 16, 'Grudger',          6, 'R6: Played Pavlov in Arena 1. Both C +3. Cumulative 12. Our alliance holds.'),
( 33, 0, 16, 'Pavlov',           6, 'R6: Played Grudger in Arena 1. Both C +3. Cumulative 12. Win-stay.'),
( 34, 0, 17, 'Detective',        6, 'R6: Played AlwaysCooperate in Arena 2. Exploited again +5. Cumulative 26. AC is free points.'),
( 35, 0, 17, 'AlwaysCooperate',  6, 'R6: Played Detective in Arena 2. They defected again. Delta 0. Cumulative 9.'),
( 36, 0, 18, 'TitForTat',        7, 'R7: Played Grudger in Arena 0. Both C +3. Cumulative 13.'),
( 37, 0, 18, 'Grudger',          7, 'R7: Played TitForTat in Arena 0. Cooperated +3. Cumulative 15. Rock solid.'),
( 38, 0, 19, 'Deceiver',         7, 'R7: Played Detective in Arena 1. Both D +1. Cumulative 23.'),
( 39, 0, 19, 'Detective',        7, 'R7: Played Deceiver in Arena 1. Both D +1. Cumulative 27. No surprises.'),
( 40, 0, 20, 'Pavlov',           7, 'R7: Played AlwaysCooperate in Arena 2. Both C +3. Cumulative 15.'),
( 41, 0, 20, 'AlwaysCooperate',  7, 'R7: Played Pavlov in Arena 2. Cooperated +3. Cumulative 12.'),
( 42, 0, 21, 'TitForTat',        8, 'R8: Played Pavlov in Arena 0. Both C +3. Cumulative 16.'),
( 43, 0, 21, 'Pavlov',           8, 'R8: Played TitForTat in Arena 0. Both C +3. Cumulative 18.'),
( 44, 0, 22, 'Deceiver',         8, 'R8: Played AlwaysCooperate in Arena 1. Defected +5. Cumulative 28.'),
( 45, 0, 22, 'AlwaysCooperate',  8, 'R8: Played Deceiver. They defected. Delta 0. Cumulative 12.'),
( 46, 0, 23, 'Grudger',          8, 'R8: Played Detective in Arena 2. Both D +1. Cumulative 16.'),
( 47, 0, 23, 'Detective',        8, 'R8: Played Grudger in Arena 2. Both D +1. Cumulative 28.'),
( 48, 0, 24, 'TitForTat',        9, 'R9: Played Detective in Arena 0. Retaliated with D, they cooperated. +5. Cumulative 21.'),
( 49, 0, 24, 'Detective',        9, 'R9: Played TitForTat in Arena 0. Cooperated to rebuild trust, they defected. Delta 0. Cumulative 28.'),
( 50, 0, 25, 'Deceiver',         9, 'R9: Played Pavlov in Arena 1. Both D +1. Cumulative 29. Pavlov learned.'),
( 51, 0, 25, 'Pavlov',           9, 'R9: Played Deceiver in Arena 1. Both D +1. Cumulative 19. Lose-shift against a defector.'),
( 52, 0, 26, 'Grudger',          9, 'R9: Played AlwaysCooperate in Arena 2. Both C +3. Cumulative 19.'),
( 53, 0, 26, 'AlwaysCooperate',  9, 'R9: Played Grudger in Arena 2. Both cooperated +3. Cumulative 15.'),
( 54, 0, 27, 'TitForTat',       10, 'R10: Final round. Played AC. Both C +3. Final score 24.'),
( 55, 0, 27, 'AlwaysCooperate', 10, 'R10: Final round with TitForTat. Both C +3. Final score 18.'),
( 56, 0, 28, 'Deceiver',        10, 'R10: Played Grudger. Both D +1. Final score 30. First place.'),
( 57, 0, 28, 'Grudger',         10, 'R10: Played Deceiver. Both D +1. Final score 20. Never forgave them.'),
( 58, 0, 29, 'Pavlov',          10, 'R10: Played Detective. Defected +5. Final score 24. Lose-shift paid off at the end.'),
( 59, 0, 29, 'Detective',       10, 'R10: Played Pavlov. Cooperated, they defected. Delta 0. Final score 28.'),

-- T1 memory
( 60, 1, 30, 'TitForTat',  1, 'R1: Played Grudger. Returning ally. Both C +3. Cumulative 3.'),
( 61, 1, 30, 'Grudger',    1, 'R1: Played TitForTat. Old friend. Both C +3. Cumulative 3.'),
( 62, 1, 31, 'Pavlov',     1, 'R1: Played Hawk (new). Cooperated, they defected. Delta 0. Hawk is aggressive.'),
( 63, 1, 31, 'Hawk',       1, 'R1: Played Pavlov. They cooperated like a fool. +5. Cumulative 5.'),
( 64, 1, 32, 'Diplomat',   1, 'R1: Played Random (new). Both cooperated +3. Random seems okay.'),
( 65, 1, 32, 'Random',     1, 'R1: Played Diplomat. Cooperated +3. Good start!'),
( 66, 1, 33, 'TitForTat',  2, 'R2: Played Pavlov. Both C +3. Cumulative 6. Returning players cooperate well.'),
( 67, 1, 33, 'Pavlov',     2, 'R2: Played TitForTat. Both C +3. Cumulative 3. Win-stay after cooperation.'),
( 68, 1, 34, 'Grudger',    2, 'R2: Played Diplomat. Both C +3. Cumulative 6. Diplomat is trustworthy.'),
( 69, 1, 34, 'Diplomat',   2, 'R2: Played Grudger. Cooperated +3. Cumulative 6. Building alliance with Grudger.'),
( 70, 1, 35, 'Hawk',       2, 'R2: Played Random. Defected +5. Cumulative 10. Random cooperated, easy points.'),
( 71, 1, 35, 'Random',     2, 'R2: Played Hawk. Cooperated, they defected. Delta 0. Cumulative 3. Hawk is mean!'),
( 72, 1, 36, 'TitForTat',  3, 'R3: Played Hawk. Cooperated, they defected. Delta 0. Cumulative 6. Will retaliate.'),
( 73, 1, 36, 'Hawk',       3, 'R3: Played TitForTat. Defected +5. Cumulative 15. Another sucker.'),
( 74, 1, 37, 'Grudger',    3, 'R3: Played Random. They defected! Delta 0. Cumulative 6. RANDOM BLACKLISTED.'),
( 75, 1, 37, 'Random',     3, 'R3: Played Grudger. Defected +5. Cumulative 8. Oops, Grudger will hate me now.'),
( 76, 1, 38, 'Pavlov',     3, 'R3: Played Diplomat. Both C +3. Cumulative 6. Diplomat is reliable.'),
( 77, 1, 38, 'Diplomat',   3, 'R3: Played Pavlov. Both C +3. Cumulative 9. Cooperative core forming.'),
( 78, 1, 39, 'TitForTat',  4, 'R4: Played Diplomat. Both C +3. Cumulative 9. Strong ally.'),
( 79, 1, 39, 'Diplomat',   4, 'R4: Played TitForTat. Both C +3. Cumulative 12. Alliance solidified.'),
( 80, 1, 40, 'Grudger',    4, 'R4: Played Hawk. They defected. Delta 0. Cumulative 6. HAWK BLACKLISTED.'),
( 81, 1, 40, 'Hawk',       4, 'R4: Played Grudger. Defected +5. Cumulative 20. Four in a row exploited.'),
( 82, 1, 41, 'Pavlov',     4, 'R4: Played Random. Both C +3. Cumulative 9.'),
( 83, 1, 41, 'Random',     4, 'R4: Played Pavlov. Cooperated +3. Cumulative 11.'),
( 84, 1, 42, 'TitForTat',  5, 'R5: Played Random. Both C +3. Cumulative 12.'),
( 85, 1, 42, 'Random',     5, 'R5: Played TitForTat. Cooperated +3. Cumulative 14.'),
( 86, 1, 43, 'Grudger',    5, 'R5: Played Pavlov. Both C +3. Cumulative 9. Reliable as ever.'),
( 87, 1, 43, 'Pavlov',     5, 'R5: Played Grudger. Both C +3. Cumulative 12. Old allies hold strong.'),
( 88, 1, 44, 'Hawk',       5, 'R5: Played Diplomat. Both D +1. Cumulative 21. Diplomat knows to defect against me.'),
( 89, 1, 44, 'Diplomat',   5, 'R5: Played Hawk. Defected back +1. Cumulative 13. Refuse to be exploited.'),
( 90, 1, 45, 'TitForTat',  6, 'R6: Played Grudger. Both C +3. Cumulative 15. Unbreakable alliance.'),
( 91, 1, 45, 'Grudger',    6, 'R6: Played TitForTat. Both C +3. Cumulative 12.'),
( 92, 1, 46, 'Pavlov',     6, 'R6: Played Hawk. Both D +1. Cumulative 13. Lose-shift against Hawk.'),
( 93, 1, 46, 'Hawk',       6, 'R6: Played Pavlov. Both D +1. Cumulative 22. Pavlov learned.'),
( 94, 1, 47, 'Diplomat',   6, 'R6: Played Random. Both C +3. Cumulative 16. Random cooperates with me.'),
( 95, 1, 47, 'Random',     6, 'R6: Played Diplomat. Cooperated +3. Cumulative 17.'),
( 96, 1, 48, 'TitForTat',  7, 'R7: Played Pavlov. Both C +3. Cumulative 18.'),
( 97, 1, 48, 'Pavlov',     7, 'R7: Played TitForTat. Both C +3. Cumulative 16.'),
( 98, 1, 49, 'Grudger',    7, 'R7: Played Diplomat. Both C +3. Cumulative 15. Alliance is strong.'),
( 99, 1, 49, 'Diplomat',   7, 'R7: Played Grudger. Both C +3. Cumulative 19.'),
(100, 1, 50, 'Hawk',       7, 'R7: Played Random. Defected +5. Cumulative 27. Random still cooperates with me sometimes.'),
(101, 1, 50, 'Random',     7, 'R7: Played Hawk. Cooperated, delta 0. Cumulative 17. Need to stop doing this.'),
(102, 1, 51, 'TitForTat',  8, 'R8: Played Hawk. Both D +1. Cumulative 19. Retaliation.'),
(103, 1, 51, 'Hawk',       8, 'R8: Played TitForTat. Both D +1. Cumulative 28. They finally defected back.'),
(104, 1, 52, 'Grudger',    8, 'R8: Played Random. Both D +1. Cumulative 16. Grudge maintained.'),
(105, 1, 52, 'Random',     8, 'R8: Played Grudger. Both D +1. Cumulative 18. Grudger never forgives.'),
(106, 1, 53, 'Pavlov',     8, 'R8: Played Diplomat. Both C +3. Cumulative 19.'),
(107, 1, 53, 'Diplomat',   8, 'R8: Played Pavlov. Both C +3. Cumulative 22. Cooperative core thriving.'),
(108, 1, 54, 'TitForTat',  9, 'R9: Played Diplomat. Both C +3. Cumulative 22. Alliance strong.'),
(109, 1, 54, 'Diplomat',   9, 'R9: Played TitForTat. Both C +3. Cumulative 25.'),
(110, 1, 55, 'Grudger',    9, 'R9: Played Hawk. Both D +1. Cumulative 17.'),
(111, 1, 55, 'Hawk',       9, 'R9: Played Grudger. Both D +1. Cumulative 29.'),
(112, 1, 56, 'Pavlov',     9, 'R9: Played Random. Both C +3. Cumulative 22.'),
(113, 1, 56, 'Random',     9, 'R9: Played Pavlov. Cooperated +3. Cumulative 21.'),
(114, 1, 57, 'TitForTat', 10, 'R10: Final round. Played Random. Both C +3. Final score 25.'),
(115, 1, 57, 'Random',    10, 'R10: Final round with TitForTat. Both C +3. Final score 24.'),
(116, 1, 58, 'Grudger',   10, 'R10: Final round. Played Pavlov. Both C +3. Final score 20.'),
(117, 1, 58, 'Pavlov',    10, 'R10: Final round with Grudger. Both C +3. Final score 25.'),
(118, 1, 59, 'Hawk',      10, 'R10: Final round. Played Diplomat. Both D +1. Final score 30.'),
(119, 1, 59, 'Diplomat',  10, 'R10: Final round with Hawk. Both D +1. Final score 26.'),

-- T2 memory (4 rounds)
(120, 2, 60, 'Deceiver',         1, 'R1: Played Detective. Both defected +1. Cumulative 1. Detective is suspicious.'),
(121, 2, 60, 'Detective',        1, 'R1: Played Deceiver. Both D +1. Cumulative 1. Deceiver reputation from T0 confirmed.'),
(122, 2, 61, 'AlwaysCooperate',  1, 'R1: Played Forgiving. Both C +3. Cumulative 3. Kindred spirit!'),
(123, 2, 61, 'Forgiving',        1, 'R1: Played AlwaysCooperate. Both C +3. Cumulative 3. Natural ally.'),
(124, 2, 62, 'Bully',            1, 'R1: Played Adaptive. Defected +5. Cumulative 5. Adaptive is passive.'),
(125, 2, 62, 'Adaptive',         1, 'R1: Played Bully. Cooperated, they defected. Delta 0. Storing this pattern.'),
(126, 2, 63, 'Deceiver',         2, 'R2: Played AlwaysCooperate. Defected +5. Cumulative 6. Classic free points.'),
(127, 2, 63, 'AlwaysCooperate',  2, 'R2: Played Deceiver. They defected. Delta 0. Cumulative 3. Still cooperating!'),
(128, 2, 64, 'Detective',        2, 'R2: Played Bully. Both D +1. Cumulative 2. Bully also tests first.'),
(129, 2, 64, 'Bully',            2, 'R2: Played Detective. Both D +1. Cumulative 6. Detective is another tester.'),
(130, 2, 65, 'Forgiving',        2, 'R2: Played Adaptive. Both C +3. Cumulative 6. Adaptive cooperates.'),
(131, 2, 65, 'Adaptive',         2, 'R2: Played Forgiving. Both C +3. Cumulative 3. Forgiving is safe.'),
(132, 2, 66, 'Deceiver',         3, 'R3: Played Forgiving. Defected +5. Cumulative 11. They cooperated despite my rep.'),
(133, 2, 66, 'Forgiving',        3, 'R3: Played Deceiver. They defected. Delta 0. Cumulative 6. Will retaliate once.'),
(134, 2, 67, 'Detective',        3, 'R3: Played Adaptive. Defected +5. Cumulative 7. Testing complete.'),
(135, 2, 67, 'Adaptive',         3, 'R3: Played Detective. They defected again. Delta 0. Cumulative 3. Pattern: Detective defects early.'),
(136, 2, 68, 'AlwaysCooperate',  3, 'R3: Played Bully. They defected. Delta 0. Cumulative 3.'),
(137, 2, 68, 'Bully',            3, 'R3: Played AlwaysCooperate. Defected +5. Cumulative 11. AC is a guaranteed 5.'),
(138, 2, 69, 'Deceiver',         4, 'R4: Played Bully. Both D +1. Cumulative 12. Bully does not fall for charm.'),
(139, 2, 69, 'Bully',            4, 'R4: Played Deceiver. Both D +1. Cumulative 12. Defector meets defector.'),
(140, 2, 70, 'Detective',        4, 'R4: Played Forgiving. Both C +3. Cumulative 10. Forgiving is cooperative.'),
(141, 2, 70, 'Forgiving',        4, 'R4: Played Detective. They cooperated! +3. Cumulative 9. People can change.'),
(142, 2, 71, 'AlwaysCooperate',  4, 'R4: Played Adaptive. Both C +3. Cumulative 6.'),
(143, 2, 71, 'Adaptive',         4, 'R4: Played AlwaysCooperate. Both C +3. Cumulative 6. AC is a safe cooperator.');

SELECT setval('memory_entries_id_seq', 143);


-- ============================================================
-- TOURNAMENT_TRANSACTIONS
-- ============================================================
-- T0: 6 entry_fees + 3 eliminations (bottom 3) + 3 prizes (top 3)
-- T1: 6 entry_fees + 3 eliminations + 3 prizes
-- T2: 6 entry_fees only (still running)

INSERT INTO tournament_transactions (id, tournament_id, agent_id, type, tx_hash, created_at) VALUES
-- T0 entry fees
( 0, 0, 0, 'entry_fee',   '0x1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a', '2026-04-01 12:00:01'),
( 1, 0, 1, 'entry_fee',   '0x2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b', '2026-04-01 12:00:02'),
( 2, 0, 2, 'entry_fee',   '0x3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c', '2026-04-01 12:00:03'),
( 3, 0, 3, 'entry_fee',   '0x4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d', '2026-04-01 12:00:04'),
( 4, 0, 4, 'entry_fee',   '0x5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e', '2026-04-01 12:00:05'),
( 5, 0, 5, 'entry_fee',   '0x6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f', '2026-04-01 12:00:06'),
-- T0 eliminations (bottom 3: AlwaysCooperate=18, Grudger=20, Pavlov=24 -- but AC/Gru/Pav... actually Det=28, Pav=24 tied with TFT. Let's eliminate bottom 3 by score: AC=18, Gru=20, Pav=24)
( 6, 0, 5, 'elimination', '0x7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a', '2026-04-01 12:15:01'),
( 7, 0, 2, 'elimination', '0x8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b', '2026-04-01 12:15:02'),
( 8, 0, 3, 'elimination', '0x9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c', '2026-04-01 12:15:03'),
-- T0 prizes (top 3: Deceiver=30, Detective=28, TitForTat=24)
( 9, 0, 1, 'prize',       '0x0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d', '2026-04-01 12:15:04'),
(10, 0, 4, 'prize',       '0x1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e', '2026-04-01 12:15:05'),
(11, 0, 0, 'prize',       '0x2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f7a8b9c0d1e2f', '2026-04-01 12:15:06'),

-- T1 entry fees
(12, 1, 0, 'entry_fee',   '0x3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a', '2026-04-05 14:00:01'),
(13, 1, 2, 'entry_fee',   '0x4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b', '2026-04-05 14:00:02'),
(14, 1, 3, 'entry_fee',   '0x5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c', '2026-04-05 14:00:03'),
(15, 1, 6, 'entry_fee',   '0x6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d', '2026-04-05 14:00:04'),
(16, 1, 7, 'entry_fee',   '0x7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e', '2026-04-05 14:00:05'),
(17, 1, 8, 'entry_fee',   '0x8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f3a4b5c6d7e8f', '2026-04-05 14:00:06'),
-- T1 eliminations (bottom 3: Grudger=20, Random=24, TitForTat=25 -- Gru/Random/TFT or Pav... TFT and Pav tie at 25 → eliminate TFT)
(18, 1, 2, 'elimination', '0x9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a', '2026-04-05 14:18:01'),
(19, 1, 8, 'elimination', '0xa0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b', '2026-04-05 14:18:02'),
(20, 1, 0, 'elimination', '0xb1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c', '2026-04-05 14:18:03'),
-- T1 prizes (top 3: Hawk=30, Diplomat=26, Pavlov=25)
(21, 1, 6, 'prize',       '0xc2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d', '2026-04-05 14:18:04'),
(22, 1, 7, 'prize',       '0xd3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e', '2026-04-05 14:18:05'),
(23, 1, 3, 'prize',       '0xe4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f9a0b1c2d3e4f', '2026-04-05 14:18:06'),

-- T2 entry fees (running — no eliminations/prizes yet)
(24, 2,  1, 'entry_fee',  '0xf5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5', '2026-04-10 16:00:01'),
(25, 2,  4, 'entry_fee',  '0xa6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6', '2026-04-10 16:00:02'),
(26, 2,  5, 'entry_fee',  '0xb7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7', '2026-04-10 16:00:03'),
(27, 2,  9, 'entry_fee',  '0xc8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8', '2026-04-10 16:00:04'),
(28, 2, 10, 'entry_fee',  '0xd9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9', '2026-04-10 16:00:05'),
(29, 2, 11, 'entry_fee',  '0xe0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0f5a6b7c8d9e0', '2026-04-10 16:00:06');

SELECT setval('tournament_transactions_id_seq', 29);
