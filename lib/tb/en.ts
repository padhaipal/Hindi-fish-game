// ---------------------------------------------------------------------------
// TB GAME — ENGLISH
// ---------------------------------------------------------------------------
// Every line of the game in English, keyed by the same id as its Hindi original
// and its (future) recording. The keys read:
//
//   s_cough                        the situation in a scene
//   s_cough_sub                    the second line of that scene, if it has one
//   s_cough_clinic                 one choice
//   s_cough_clinic_result          what happened when it was chosen
//   s_cough_clinic_result_fact     the true fact behind it
//   end_curedClean / _fact         an ending
//   intro, life_*, rules_*, meter_*  the screens around the story
//
// `npm run tb:audio` lists any id missing from here, so this cannot silently
// fall behind the Hindi.
//
// This is a translation, not a transliteration: it says the same thing to
// somebody reading English, in the same plain register. Keep it short — these
// are spoken lines on a phone screen, not paragraphs.
// ---------------------------------------------------------------------------

export const EN_LINES: Record<string, string> = {
  // ---- the screens around the game ---------------------------------------
  intro:
    "Finish six months of treatment. Stay alive, get cured, and don't give TB to anyone at home.",
  life_intro: "This is your household.",
  life_start: "Now you have started coughing. The decisions are yours.",

  life_home_ekKamra: "A one-room house — everyone sleeps together",
  life_home_doKamre: "A two-room house",
  life_work_dihadi: "Daily-wage labour — earn today, eat today",
  life_work_dukan: "A small shop",
  life_work_kheti: "Farming and labouring",
  life_risk_kamzori: "Weakness — your weight is very low",
  life_risk_bidi: "Bidis — you smoke every day",
  life_risk_sharab: "Alcohol — you drink every day",
  life_risk_sugar: "Diabetes",
  life_risk_dhool: "Smoke and dust at work",
  life_risk_hiv: "HIV",

  meter_health_good: "Your health is good.",
  meter_health_mid: "You are getting weaker. Take care.",
  meter_health_low: "You are in a bad way. Your life is at risk.",
  meter_money_ok: "There is still some money in the house.",
  meter_money_low: "The money in the house has almost run out.",
  meter_family_clear: "Nobody at home has TB yet.",
  meter_family_ill: "Someone at home has caught TB.",

  rules_health:
    "This is your health. Medicine and good food raise it. If it empties, you will not survive.",
  rules_money: "This is the household's money. Private treatment and debt drain it.",
  rules_family: "These are the people at home. Your breath can give them TB too.",
  rules_months: "You must finish six months of medicine.",
  rules_win: "You win if you stay alive, the TB is gone, and nobody at home has TB.",
  rules_lose: "You lose if your health runs out, or the medicine stops partway.",

  // ---- Chapter 1: the cough that will not go -----------------------------
  s_cough: "Two weeks now. The cough will not go. You sweat at night.",
  s_cough_sub: "What will you do?",
  s_cough_wait: "Nothing — it will get better on its own",
  s_cough_wait_result:
    "Another month went by. The cough got worse and you started losing weight.",
  s_cough_wait_result_fact:
    "A cough for more than two weeks, fever, night sweats or weight loss — any of these can mean TB. Waiting will not make TB go away.",
  s_cough_syrup: "Buy cough syrup from the medicine shop",
  s_cough_syrup_result:
    "The syrup helped for two days, then the cough came back. The money is gone too.",
  s_cough_syrup_result_fact:
    "Cough syrup and fever tablets bring a little relief, but they do not kill TB germs. Only the full TB treatment cures TB.",
  s_cough_clinic: "See a doctor at the government hospital",
  s_cough_clinic_result:
    "You reached the government hospital. The doctor listened to you carefully.",
  s_cough_clinic_result_fact:
    "TB testing and treatment are completely free at a government hospital. The sooner you are tested, the sooner you are cured.",

  s_ask: "It is your turn in front of the doctor.",
  s_ask_sub: "What will you say?",
  s_ask_askTb: "Ask — “Could this be TB?”",
  s_ask_askTb_result:
    "The doctor said you did well to ask. Let us test your sputum.",
  s_ask_askTb_result_fact:
    "When you see a doctor, do ask “could this be TB?”. That one question can save months of delay.",
  s_ask_onlyFever: "Just ask for something for the fever and cough",
  s_ask_onlyFever_result:
    "You got the medicine. Three weeks later the cough was worse.",
  s_ask_onlyFever_result_fact:
    "Fever and cough medicine hides the symptoms, but the TB keeps growing inside and keeps travelling to other people on your breath.",
  s_ask_shy: "Say nothing, out of embarrassment",
  s_ask_shy_result: "You came home without saying anything. The cough went on.",
  s_ask_shy_result_fact:
    "TB can happen to anyone — rich, poor, child, old. There is nothing to be ashamed of. We all breathe, so we can all get TB.",

  s_cough2: "Now there is blood in your cough. Your clothes hang loose.",
  s_cough2_sub: "Where will you go now?",
  s_cough2_quack: "Get injections from the village “doctor”",
  s_cough2_quack_result:
    "Three injections, a lot of money, and the cough exactly where it was.",
  s_cough2_quack_result_fact:
    "Injections from an unqualified “doctor” do not cure TB. TB is found by testing sputum and cured by a course of tablets.",
  s_cough2_private: "Go to a private hospital",
  s_cough2_private_result:
    "They tested you and found TB — but the bill for the tests and medicines is heavy.",
  s_cough2_private_result_fact:
    "The same TB medicines cost thousands of rupees in private care. The same test and the same medicines are free at a government hospital and DOTS centre.",
  s_cough2_clinic: "Go to the government hospital",
  s_cough2_clinic_result:
    "The doctor said — have your sputum tested, this could be TB.",
  s_cough2_clinic_result_fact:
    "You have lost time, but TB can still be cured completely. The test and the medicine are free.",

  s_cough3: "Now even walking leaves you breathless. You have stopped going to work.",
  s_cough3_sub: "This is your last chance.",
  s_cough3_clinic: "Go to the government hospital",
  s_cough3_clinic_result:
    "Your family took you to the hospital. The doctor ordered a sputum test straight away.",
  s_cough3_clinic_result_fact:
    "Starting treatment late makes a full recovery harder — but not treating it at all costs you your life.",
  s_cough3_home: "Stay lying at home",
  s_cough3_home_result:
    "You got worse every day. The people at home started coughing too.",
  s_cough3_home_result_fact:
    "About two out of every three people with untreated TB of the lungs die, and one person with untreated TB can pass it to ten or fifteen people in a year.",

  // ---- Chapter 2: the test ------------------------------------------------
  s_sputum: "You must give a sputum sample for the test. You have a plastic container.",
  s_sputum_sub: "How will you give the sample?",
  s_sputum_good: "Breathe deep, hold it, cough hard — then spit into the container",
  s_sputum_good_result:
    "A good sample. The machine found TB germs in your sputum.",
  s_sputum_good_result_fact:
    "The sputum must come up from your lungs, not be spit from your mouth. Usually you give two samples. This sample is what shows whether you have TB.",
  s_sputum_saliva: "Put spit from your mouth into the container",
  s_sputum_saliva_result:
    "The test came back “negative” ⊖. The cough stayed, so the doctor asked for another sample — ten more days gone.",
  s_sputum_saliva_result_fact:
    "Saliva gives a false result. If the report is negative but the symptoms carry on, get tested again.",
  s_sputum_leave: "You feel ashamed — take the container home",
  s_sputum_leave_result: "The container sat at home. Another month went by.",
  s_sputum_leave_result_fact:
    "Without the sputum test there is no way to know whether you have TB. The test is free and done the same day.",

  s_sputum2: "This time you gave the sample properly — coughing deep from the lungs.",
  s_sputum2_ok: "Wait for the report",
  s_sputum2_ok_result: "The machine found TB in your sputum.",
  s_sputum2_ok_result_fact:
    "The CBNAAT machine also tells the doctor, in the same test, whether the usual TB medicines will work on this TB.",

  s_result: "The report is “positive” ⊕ — you have TB of the lungs.",
  s_result_sub: "The doctor says — don't be frightened, this is completely curable.",
  s_result_startNow: "Start treatment today",
  s_result_startNow_result:
    "The doctor wrote your slip — you collect the medicine from the DOTS centre.",
  s_result_startNow_result_fact:
    "Treatment should start as soon as TB is found. Nine out of ten people who complete the full course are cured.",
  s_result_thinkAbout: "Go home to think about it",
  s_result_thinkAbout_result:
    "Two weeks went by thinking. You grew weaker still.",
  s_result_thinkAbout_result_fact:
    "TB damages the lungs a little more every day and keeps travelling to other people on your breath. There is nothing to gain by waiting.",

  s_comorbid: "The doctor says — every TB patient is also tested for diabetes and HIV.",
  s_comorbid_sub: "Both tests are free and the result stays private.",
  s_comorbid_bothTests: "Have both tests",
  s_comorbid_bothTests_result:
    "The tests are done. The doctor now knows what else is going on in your body.",
  s_comorbid_bothTests_result_fact:
    "People with diabetes are two to three times more likely to get TB, and TB is slower to cure if the diabetes is not controlled. If you have HIV, its medicine must start alongside the TB medicine — both tests are free at a government hospital.",
  s_comorbid_sugarOnly: "Have the diabetes test only",
  s_comorbid_sugarOnly_result: "The diabetes test was done, the HIV test was not.",
  s_comorbid_sugarOnly_result_fact:
    "An HIV test result is kept completely private. If it is found, its medicine treats both the HIV and the TB together.",
  s_comorbid_noTests: "No other tests — just give me the TB medicine",
  s_comorbid_noTests_result:
    "Only the TB treatment started. The body's other weaknesses stayed hidden.",
  s_comorbid_noTests_result_fact:
    "TB alongside diabetes, HIV, undernutrition, bidis or alcohol takes longer to cure and carries more danger. That is why these tests are done.",

  s_docs: "To collect the medicine from the DOTS centre the first time, you need three things.",
  s_docs_sub: "What will you take?",
  s_docs_threeDocs: "The doctor's slip, Aadhaar card and bank passbook — photocopies of all three",
  s_docs_threeDocs_result:
    "You were registered on Ni-kshay, given a Ni-kshay ID, and six months of medicine free.",
  s_docs_threeDocs_result_fact:
    "The Ni-kshay Poshan Yojana pays money into your account every month during treatment, so you can eat well alongside the medicine. Write your Ni-kshay ID down and keep it safe.",
  s_docs_justGo: "Just turn up with nothing",
  s_docs_justGo_result:
    "You got the medicine, but with no papers you were not registered on Ni-kshay — so no money will come.",
  s_docs_justGo_result_fact:
    "Give photocopies of your Aadhaar card and bank passbook to the DOTS centre — only then does the Ni-kshay Poshan Yojana money reach your account.",
  s_docs_privateBuy: "Buy the medicine from a shop, who has time for the centre",
  s_docs_privateBuy_result: "One month of medicine emptied your pocket.",
  s_docs_privateBuy_result_fact:
    "Those same four medicines are free at the DOTS centre. Spending the household's money on TB is one of the biggest mistakes there is.",

  // ---- Chapter 3: the house ----------------------------------------------
  s_tell: "You got home. Everyone is asking — what did the doctor say?",
  s_tell_tell: "Tell them all the truth",
  s_tell_tell_result:
    "The family stood with you — one will remind you about the medicine, another will come to the centre with you.",
  s_tell_tell_result_fact:
    "A person with TB needs their family more than anything. The people whose families stand by them are the ones who finish the treatment.",
  s_tell_hide: "Hide it — what will people say",
  s_tell_hide_result:
    "You took the medicine in secret. Nothing at home changed to keep anyone safe.",
  s_tell_hide_result_fact:
    "Hiding it means the people at home cannot protect themselves, and nobody takes them to be tested. TB is an illness to treat, not a secret to keep.",

  s_home: "The house is small and everyone sleeps in one room.",
  s_home_sub: "What will you do to protect them?",
  s_home_airMask: "Open the window and door, sit outside, cover your mouth when you cough",
  s_home_airMask_result:
    "Sun and air came into the room. You started covering your mouth when you coughed.",
  s_home_airMask_result_fact:
    "TB travels through the air. Open air, sunlight and covering your mouth when you cough or sneeze are what protect your family. Do not spit here and there.",
  s_home_utensils: "Keep your plates, food and clothes separate",
  s_home_utensils_result:
    "A wall went up inside the house — and the air stayed exactly as it was.",
  s_home_utensils_result_fact:
    "TB spreads only through the air, not through plates, food or clothes. Keeping your things separate protects nobody; it only leaves the patient alone.",
  s_home_nothing: "Change nothing",
  s_home_nothing_result: "Everyone went on sleeping together in the closed room.",
  s_home_nothing_result_fact:
    "The most dangerous thing in the first weeks of treatment is spending long hours in a closed room with the patient. Opening a window costs nothing.",

  s_contacts: "The doctor said — bring everyone at home for testing, the children especially.",
  s_contacts_allTested: "Take the whole household to be tested",
  s_contacts_allTested_result:
    "Everyone was tested. Nobody had TB, and the children were started on preventive medicine.",
  s_contacts_allTested_result_fact:
    "In a house where there is TB, testing everyone else is free. Children and weaker people are given preventive treatment (TPT), which makes it far less likely they will ever get TB.",
  s_contacts_childOnly: "Take only the youngest child",
  s_contacts_childOnly_result:
    "The child got the preventive medicine; the rest of the household was not tested.",
  s_contacts_childOnly_result_fact:
    "Anyone at home with a cough, fever or weight loss must be tested — adults fall ill too.",
  s_contacts_none: "Take nobody — they are all fine",
  s_contacts_none_result: "Nobody was tested.",
  s_contacts_none_result_fact:
    "TB grows quietly at first — it is in the body before it shows. That is why the people at home should be tested without waiting for symptoms.",

  // ---- Month 1: the medicine starts to bite ------------------------------
  s_month1_side:
    "Twenty days on the medicine. Your urine has turned red-orange and you feel sick.",
  s_month1_side_sub: "What will you do?",
  s_month1_side_askDots: "Ask at the DOTS centre, and take the medicine after food",
  s_month1_side_askDots_result:
    "The staff laughed — red urine is just the medicine, nothing to fear. Taking it after food settled your stomach.",
  s_month1_side_askDots_result_fact:
    "Red or orange urine is very common and completely harmless. If you feel sick or cannot eat, eat a little at a time, often. But if your eyes or skin turn yellow, you vomit again and again, or your hearing or eyesight fades — stop the medicine and see a doctor at once.",
  s_month1_side_stop: "Stop the medicine — it is what is harming you",
  s_month1_side_stop_result:
    "You stopped the medicine. Two weeks later the cough was fierce again.",
  s_month1_side_stop_result_fact:
    "The smaller troubles the medicine causes can be treated — a doctor can give you something else for relief. Stopping without asking brings the TB back, and brings it back stubborn.",
  s_month1_side_quackMed: "Get some other medicine from the village practitioner",
  s_month1_side_quackMed_result:
    "He handed you a strength tonic. The TB tablets were missed for a few days.",
  s_month1_side_quackMed_result_fact:
    "The TB dose is set by your weight — exactly the number of tablets you were told, every day, no more and no fewer. Missing days partway through is the most dangerous thing of all.",

  // ---- Month 2: no work, no money ---------------------------------------
  s_money: "You lost your work because of the weakness. The money at home is running out.",
  s_money_nikshay: "Ask the DOTS centre and the ASHA worker for help",
  s_money_nikshay_result:
    "The Ni-kshay money started arriving in your account and the ASHA worker arranged rations.",
  s_money_nikshay_result_fact:
    "Every TB patient gets Ni-kshay Poshan Yojana money. If nothing arrives after two to four months, ask at the DOTS centre or call the helpline on 1800-116666 — you will need your Ni-kshay ID. ASHA workers and Jan Seva Kendras help too.",
  s_money_loan: "Borrow from the moneylender at interest",
  s_money_loan_result: "Today is covered, but the interest is on your head now.",
  s_money_loan_result_fact:
    "Most of what TB costs a household goes on tests, private medicine and travel. Government treatment and the Ni-kshay support are what save you from this debt.",
  s_money_workStop: "Stop the medicine and go back to work",
  s_money_workStop_result:
    "You earned the wage, but the medicine was missed and the cough returned.",
  s_money_workStop_result_fact:
    "You do not have to choose between work and medicine — the tablets can be taken in the evening, and the Ni-kshay money exists for exactly this. Missing the medicine starts the TB spreading again.",

  // ---- Nutrition ---------------------------------------------------------
  s_food: "Your weight is still low. The neighbours are full of advice.",
  s_food_sub: "What will you do to get your strength back?",
  s_food_normalFood:
    "Eat more of your ordinary cheap food — dal, eggs, gur and chana, bananas, vegetables",
  s_food_normalFood_result:
    "You ate a little at a time, several times a day. Within a month your weight began to rise.",
  s_food_normalFood_result_fact:
    "A person with TB needs more body-building food (dal, milk and curd, eggs, peanuts) and more energy food (grains, gur, oil and ghee) than other people. Patients who stay very thin and weak get less benefit from the medicine and are more likely to have the TB return.",
  s_food_tonic: "Get an expensive tonic and a glucose drip",
  s_food_tonic_result: "The money went; the strength did not come.",
  s_food_tonic_result_fact:
    "Glucose drips, body-building powders and tonics do little. As long as you can eat, ordinary cheap food from around you is best — apples and almonds are not required.",
  s_food_eatLess: "You have no appetite — eat less",
  s_food_eatLess_result:
    "Your weight fell further. Now even climbing steps leaves you breathless.",
  s_food_eatLess_result_fact:
    "If your appetite is poor, don't try to eat a lot at once — eat a little, many times a day. Patients who are badly underweight are several times more likely to die of TB.",

  // ---- Habits -------------------------------------------------------------
  s_habit: "Friends are sitting outside in the evening. One offers a bidi, another a glass.",
  s_habit_refuse: "Say no — “I'm on treatment”",
  s_habit_refuse_result:
    "Your friends did not mind. You coughed less that night.",
  s_habit_refuse_result_fact:
    "Alcohol harms your body and stops the TB medicine working properly. Bidi and cigarette smoke weakens the lungs further and makes the TB more likely to come back.",
  s_habit_sharab: "Take a little, what harm can it do",
  s_habit_sharab_result:
    "That night the medicine was missed too. Your stomach hurt in the morning.",
  s_habit_sharab_result_fact:
    "TB medicine and alcohol together can damage the liver. That is often why a doctor has to stop the treatment partway.",
  s_habit_bidi: "Have the bidi, not the drink",
  s_habit_bidi_result: "You coughed all night.",
  s_habit_bidi_result_fact:
    "People who smoke bidis take longer to be cured and are more likely to get TB again. Treatment is the best chance you will ever have to stop.",

  // ---- Month 2: the follow-up test ---------------------------------------
  s_month2_test: "Two months done. The DOTS worker has called you for another sputum test.",
  s_month2_test_test: "Go for the test",
  s_month2_test_test_result:
    "The report came back “negative” ⊖. The doctor changed the medicine — one drug stops now, three carry on.",
  s_month2_test_test_result_fact:
    "The two-month test shows whether the medicine is working. If it is negative the medicines change and carry on for four more months, then there is a final test.",
  s_month2_test_skip: "Don't go — you feel fine now",
  s_month2_test_skip_result:
    "No test, so no way of knowing whether the medicine is working.",
  s_month2_test_skip_result_fact:
    "Feeling better is not enough. Only the test partway through shows whether the TB is dying or turning stubborn.",

  // ---- The big one --------------------------------------------------------
  s_better: "Three months gone. The cough has left, your appetite is back, you are working again.",
  s_better_sub: "There are still three months of medicine in the box.",
  s_better_continue: "Take the medicine for the full six months",
  s_better_continue_result:
    "You did not miss a day's tablets — whether you felt well or ill.",
  s_better_continue_result_fact:
    "You feel much better within a month of starting, but the germs are still alive. Only the full six months kills TB at the root.",
  s_better_stop: "You feel fine now — stop the medicine",
  s_better_stop_result:
    "The box sat unopened. Two months later the fever and cough came back — worse than before.",
  s_better_stop_result_fact:
    "Stopping partway lets the surviving germs get used to the medicine. Then that medicine no longer works — this is drug-resistant TB.",
  s_better_skipDays: "Take it every other day, make it last",
  s_better_skipDays_result:
    "Some days yes, some days no. The germs got their chance to recover.",
  s_better_skipDays_result_fact:
    "Half-taken medicine does not kill TB, it only strengthens it. Take the same number of tablets every day, no more and no fewer.",

  // ---- Month 4: work in another city -------------------------------------
  s_travel: "There is work in the city. You will have to go — but your medicine comes from the centre here.",
  s_travel_transfer: "Tell the DOTS centre and have the medicine transferred there",
  s_travel_transfer_result:
    "Your Ni-kshay ID moved your treatment to the city centre. The medicine carried on and so did the earnings.",
  s_travel_transfer_result_fact:
    "If work takes you to another city, your treatment travels with you — tell the DOTS centre first, or call the helpline on 1800-116666. The medicine is free anywhere.",
  s_travel_justGo: "Slip away quietly, sort the medicine out later",
  s_travel_justGo_result:
    "In the city you never found out where to get it. Six weeks of medicine were missed.",
  s_travel_justGo_result_fact:
    "Treatment breaking off partway is the biggest single cause of drug-resistant TB. Telling the centre before you go is all it takes.",
  s_travel_stay: "Turn the work down and stay here",
  s_travel_stay_result:
    "The medicine carried on, but running the household got harder.",
  s_travel_stay_result_fact:
    "You do not have to give up earning to be treated. Once you are registered on Ni-kshay your treatment can continue anywhere in the country.",

  // ---- Month 5: the neighbours --------------------------------------------
  s_stigma: "Word has gone round the neighbourhood. The contractor has told you not to come to work.",
  s_stigma_explain: "Tell everyone the truth",
  s_stigma_explain_result:
    "You explained that after three or four weeks of medicine TB no longer spreads. The contractor agreed.",
  s_stigma_explain_result_fact:
    "Once a patient has taken the medicine for three or four weeks, they do not spread TB. There is no need for separate plates, food or clothes either — TB spreads only through the air.",
  s_stigma_hideAway: "Stay at home out of shame",
  s_stigma_hideAway_result: "No earnings — and your spirits sank too.",
  s_stigma_hideAway_result_fact:
    "TB can happen to anyone; there is nothing to be ashamed of. Being cut off is what makes people abandon treatment, so keep your family and friends close.",
  s_stigma_quitTreat: "Stop the treatment, so nobody finds out",
  s_stigma_quitTreat_result:
    "You stopped the medicine. Within a month the fever was back.",
  s_stigma_quitTreat_result_fact:
    "Stopping treatment because of what people say is gambling with your own life. Half-treated TB comes back stubborn — and it is that stubborn TB the people at home then catch.",

  s_neighbour: "The man next door has been coughing for three weeks. He is buying syrup from the medicine shop.",
  s_neighbour_sendTest: "Send him to get tested",
  s_neighbour_sendTest_result:
    "He had his sputum tested. It was TB — and treatment started right at the beginning.",
  s_neighbour_sendTest_result_fact:
    "Anyone who has coughed for more than two weeks should be tested. TB caught early is cured quickly and stops spreading any further.",
  s_neighbour_quiet: "Say nothing — you have enough troubles",
  s_neighbour_quiet_result: "His cough carried on.",
  s_neighbour_quiet_result_fact:
    "One person with untreated TB can pass it to ten or fifteen people in a year. Saying one thing can save someone's life.",

  // ---- Month 6: the finish line -------------------------------------------
  s_month6: "Six months is nearly done. The last strip of tablets is left.",
  s_month6_finish: "Finish every last tablet and take the final test",
  s_month6_finish_result:
    "The final sputum test came back “negative” ⊖. The doctor said — treatment complete, the TB is gone.",
  s_month6_finish_result_fact:
    "Only the final test confirms the TB is completely gone. Even afterwards, if a cough, fever or weight loss returns, get tested again.",
  s_month6_skipLast: "Leave the rest of the tablets, what is the test for now",
  s_month6_skipLast_result:
    "The last days' medicine was missed and no test was done.",
  s_month6_skipLast_result_fact:
    "The final week's medicine is for the most stubborn germs of all. Skipping it multiplies the risk of the TB returning.",

  // ---- The drug-resistant road --------------------------------------------
  s_relapse: "The cough and fever are back, and this time the medicine is not working.",
  s_relapse_backToDots: "Go straight to the DOTS centre and tell them everything",
  s_relapse_backToDots_result:
    "The doctor ordered the special sputum test (CBNAAT) — the TB is drug-resistant.",
  s_relapse_backToDots_result_fact:
    "If the medicine has been missed, do not hide it. The CBNAAT test shows which medicines will no longer work, and the new treatment is chosen from that.",
  s_relapse_hideIt: "Tell nobody, just take the old medicine again",
  s_relapse_hideIt_result:
    "You took the same medicine again, and this time it did nothing. You went downhill fast.",
  s_relapse_hideIt_result_fact:
    "The old medicine does not work on stubborn TB. Every day of delay is more danger — and the people at home catch that same stubborn TB.",

  s_mdr: "The doctor says — don't be frightened. Drug-resistant TB can be treated too, but it takes longer.",
  s_mdr_sub: "The new medicines are free from the DOTS-Plus centre.",
  s_mdr_startMdr: "Start the new medicine and this time don't miss a single day",
  s_mdr_startMdr_result:
    "It took months, there were more tablets and more side effects — but this time you did not miss a day.",
  s_mdr_startMdr_result_fact:
    "The medicines for drug-resistant TB (bedaquiline, pretomanid, linezolid, moxifloxacin) are also free, from a DOTS or DOTS-Plus centre. Treatment can run from six months to two years.",
  s_mdr_privateMdr: "Get treated at a private hospital",
  s_mdr_privateMdr_result: "The treatment went ahead, but you had to mortgage the land.",
  s_mdr_privateMdr_result_fact:
    "Drug-resistant TB medicine costs lakhs in private care. The same medicine is free at a government DOTS-Plus centre.",
  s_mdr_giveUp: "Nothing can be done now — give up the treatment",
  s_mdr_giveUp_result: "The treatment stopped.",
  s_mdr_giveUp_result_fact:
    "Drug-resistant TB can be treated, and that treatment is free too. Abandoning it makes surviving it very unlikely.",

  // ---- endings -------------------------------------------------------------
  end_curedClean:
    "You are completely cured. Nobody at home got TB. You won!",
  end_curedClean_fact:
    "Nine out of ten people who complete the full six months of treatment are cured. Three or four weeks after starting the medicine, the illness stops spreading to others.",
  end_curedInfected:
    "You were cured — but someone else at home caught TB. Now they must be treated too.",
  end_curedInfected_fact:
    "TB spreads through the air. Early testing, an open window, covering your mouth, and preventive medicine for the children are what keep a household safe.",
  end_curedResistant:
    "You survived, but the medicine stopped partway and the TB turned stubborn. The treatment was long and very hard.",
  end_curedResistant_fact:
    "Stopping the medicine partway lets TB germs defeat the medicine. Then the same medicine no longer works and the chance of being cured falls.",
  end_died: "The treatment came too late and the body lost.",
  end_died_fact:
    "About two out of every three people with untreated TB die. But testing and treatment are free at a government hospital — treatment in time saves your life.",
  end_spreading:
    "There was no treatment. The cough went on and the people at home fell ill too.",
  end_spreading_fact:
    "One person who does not get treated can pass TB to ten or fifteen people in a year.",
};
