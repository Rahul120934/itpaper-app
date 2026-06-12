-- =============================================================================
-- SECURITY NOTES:
-- 1. RLS is ENABLED on ALL tables (papers, bookmarks).
-- 2. The anon key used by the client only has SELECT permission on papers.
-- 3. The service_role key is NEVER used or exposed on the client.
-- 4. UPDATE/DELETE on papers are explicitly denied to all non-admin roles.
-- =============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create papers table
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  abstract TEXT NOT NULL,
  venue TEXT NOT NULL,
  publish_year INTEGER NOT NULL,
  pdf_url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, paper_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for 'papers' table
-- Anyone can read papers
CREATE POLICY "Allow public read access to papers" ON papers
  FOR SELECT USING (true);

-- Only authenticated administrators should write/update (For simplicity, we let authenticated users insert mock papers if they want, or restrict it)
CREATE POLICY "Allow authenticated inserts to papers" ON papers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Explicitly deny UPDATE on papers to all users (admin operations should use service_role via server-side only)
CREATE POLICY "Deny update on papers" ON papers
  FOR UPDATE USING (false);

-- Explicitly deny DELETE on papers to all users
CREATE POLICY "Deny delete on papers" ON papers
  FOR DELETE USING (false);

-- Policies for 'bookmarks' table
-- Users can view their own bookmarks
CREATE POLICY "Allow users to select their own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Allow users to insert their own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Allow users to delete their own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Seed Initial Sample Papers
INSERT INTO papers (title, authors, abstract, venue, publish_year, pdf_url, category)
VALUES
(
  'Attention Is All You Need',
  ARRAY['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
  'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
  'Advances in Neural Information Processing Systems (NeurIPS)',
  2017,
  'https://arxiv.org/pdf/1706.03762.pdf',
  'Artificial Intelligence'
),
(
  'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
  ARRAY['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
  'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be fine-tuned with just one additional output layer to create state-of-the-art models for a wide range of tasks, such as question answering and language inference, without substantial task-specific architecture modifications.',
  'North American Chapter of the Association for Computational Linguistics (NAACL)',
  2019,
  'https://arxiv.org/pdf/1810.04805.pdf',
  'Natural Language Processing'
),
(
  'Deep Residual Learning for Image Recognition',
  ARRAY['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
  'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with up to 152 layers—8x deeper than VGG nets but still having lower complexity.',
  'IEEE Conference on Computer Vision and Pattern Recognition (CVPR)',
  2016,
  'https://arxiv.org/pdf/1512.03385.pdf',
  'Computer Vision'
),
(
  'Bitcoin: A Peer-to-Peer Electronic Cash System',
  ARRAY['Satoshi Nakamoto'],
  'A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution. Digital signatures provide part of the solution, but the main benefits are lost if a trusted third party is still required to prevent double-spending. We propose a solution to the double-spending problem using a peer-to-peer network. The network timestamps transactions by hashing them into an ongoing chain of hash-based proof-of-work, forming a record that cannot be changed without redoing the proof-of-work.',
  'Cryptography Mailing List',
  2008,
  'https://bitcoin.org/bitcoin.pdf',
  'Distributed Systems'
),
(
  'Spanner: Google''s Globally Distributed Database',
  ARRAY['James C. Corbett', 'Jeffrey Dean', 'Michael Epstein', 'Andrew Fikes', 'Christopher Frost', 'JJ Furman', 'Sanjay Ghemawat', 'Andrey Gubarev'],
  'Spanner is Google''s globally distributed NewSQL database, which manages replicated data at a global scale and supports externally consistent distributed transactions. Spanner is the first system to distribute data globally and support externally-consistent transactions at scale. It uses a novel API called TrueTime, which exposes clock uncertainty, to assign globally meaningful commit timestamps. TrueTime bounds the uncertainty of hardware clocks (GPS receivers and atomic clocks) to enable strong consistency guarantees.',
  'ACM Transactions on Computer Systems (TOCS)',
  2012,
  'https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf',
  'Databases'
),
(
  'Dynamo: Amazon''s Highly Available Key-value Store',
  ARRAY['Giuseppe DeCandia', 'Deniz Hastorun', 'Madan Jampani', 'Gunavardhan Kakulapati', 'Alex Pilchin', 'Swaminathan Sivasubramanian', 'Peter Vosshall', 'Werner Vogels'],
  'Reliability at massive scale is one of the biggest challenges we face at Amazon.com. To meet these challenges, Amazon has developed Dynamo, a highly available key-value storage system that some of Amazon''s core services use to manage their state. Dynamo uses a synthesis of well-known techniques to achieve scalability and availability: database partitioning and replication using consistent hashing, object versioning via vector clocks, and decentralized membership protocol for node coordination.',
  'ACM Symposium on Operating Systems Principles (SOSP)',
  2007,
  'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf',
  'Distributed Systems'
);
